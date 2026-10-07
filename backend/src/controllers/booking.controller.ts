import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Shop from '../models/Shop';
import Branch from '../models/Branch';
import Service from '../models/Service';
import Booking, { BookingStatus } from '../models/Booking';
import Staff from '../models/Staff';
import User from '../models/User';
import Coupon from '../models/Coupon';
import PlatformSettings from '../models/PlatformSettings';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { getIO } from '../sockets';
import { sendNotification } from '../services/notification.service';
import { NotificationType } from '../models/Notification';

// Helper to convert "HH:mm" to minutes
const timeToMins = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper to convert minutes to "HH:mm"
const minsToTime = (mins: number) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Create Booking
export const createBooking = async (req: Request, res: Response) => {
  const { shopId, branchId, staffId, serviceIds, date, startTime, endTime, pointsToRedeem, couponCode, paymentMethod, guestName, partySize } = req.body;
  const userId = req.user!.id;

  const shop = await Shop.findOne({ _id: shopId as any, isApproved: true });
  if (!shop) throw new NotFoundError('Shop not found or not approved');

  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, shopId, isActive: true });
    if (!branch) throw new BadRequestError('الفرع غير صالح لهذا الصالون');
  }

  const staff = await Staff.findOne({ _id: staffId as any, shopId: shopId as any });
  if (!staff) throw new NotFoundError('Staff not found in this shop');
  if (branchId && staff.branchId && staff.branchId.toString() !== String(branchId)) {
    throw new BadRequestError('الموظف غير متاح في هذا الفرع');
  }

  // Overlap Check
  const parsedDate = new Date(date);
  const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

  const overlappingBooking = await Booking.findOne({
    staffId: staff._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: BookingStatus.CANCELLED },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  });

  if (overlappingBooking) {
    throw new BadRequestError('This staff member is already booked for this time slot');
  }

  const services = await Service.find({ _id: { $in: serviceIds }, shopId });
  if (services.length !== serviceIds.length) {
    throw new BadRequestError('Invalid services selected');
  }

  const originalPrice = services.reduce((acc, curr) => acc + curr.price, 0);
  let discountAmount = 0;
  let pointsRedeemed = 0;
  let couponId = undefined;

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), shopId, isActive: true });
    if (!coupon) throw new BadRequestError('Invalid or inactive coupon code');
    if (new Date() > coupon.expiryDate) throw new BadRequestError('Coupon is expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit reached');
    }

    const collectedCoupons = user.collectedCoupons || [];
    const collectedCouponIndex = collectedCoupons.findIndex(c => c.couponId.toString() === coupon._id.toString());
    if (collectedCouponIndex !== -1 && collectedCoupons[collectedCouponIndex]!.isUsed) {
      throw new BadRequestError('You have already used this coupon');
    }

    let couponDiscount = (originalPrice * coupon.discountPercentage) / 100;
    if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
      couponDiscount = coupon.maxDiscount;
    }

    discountAmount += couponDiscount;
    couponId = coupon._id;

    coupon.usedCount += 1;
    await coupon.save();

    if (collectedCouponIndex !== -1) {
      user.collectedCoupons![collectedCouponIndex]!.isUsed = true;
      user.collectedCoupons![collectedCouponIndex]!.usedAt = new Date();
    } else {
      if (!user.collectedCoupons) user.collectedCoupons = [];
      user.collectedCoupons.push({ couponId: coupon._id as any, isUsed: true, collectedAt: new Date(), usedAt: new Date() });
    }
  }

  if (pointsToRedeem && pointsToRedeem > 0) {
    if (user.loyaltyPoints < pointsToRedeem) {
      throw new BadRequestError('Insufficient loyalty points');
    }

    const potentialDiscount = pointsToRedeem / 100;
    const remainingBalance = originalPrice - discountAmount;
    const pointsDiscount = Math.min(potentialDiscount, remainingBalance);
    
    pointsRedeemed = pointsDiscount * 100;
    user.loyaltyPoints -= pointsRedeemed;
    discountAmount += pointsDiscount;
  }

  await user.save();

  const totalPrice = originalPrice - discountAmount;
  const pointsEarned = Math.floor(totalPrice);

  const settings = await PlatformSettings.findOne({ isGlobal: true });
  const depositPct =
    shop.requiresDeposit
      ? (shop.depositPercent ?? settings?.depositPercent ?? 20)
      : 0;
  const depositAmount = Math.round((totalPrice * depositPct) / 100);

  const bookingData: any = {
    userId,
    shopId,
    branchId: branchId || undefined,
    staffId: staff._id,
    serviceIds,
    date,
    startTime,
    endTime,
    guestName: guestName || undefined,
    partySize: Math.max(1, Number(partySize) || 1),
    originalPrice,
    discountAmount,
    pointsRedeemed,
    pointsEarned,
    totalPrice,
    paymentMethod: paymentMethod || 'cash',
    depositAmount,
    depositPaid: false,
    feeCharged: 0,
    feeType: 'none',
    status: BookingStatus.PENDING,
  };

  if (couponId) {
    bookingData.couponId = couponId;
  }

  const booking = await Booking.create(bookingData);

  const ownerId = shop.ownerId?.toString?.() || shop.ownerId;
  if (ownerId) {
    await sendNotification({
      recipientId: ownerId.toString(),
      title: 'حجز جديد',
      message: `لديك حجز جديد في ${shop.name} الساعة ${startTime}`,
      type: NotificationType.BOOKING_UPDATED,
      data: { bookingId: booking._id, screen: 'Bookings' },
    });
  }

  await sendNotification({
    recipientId: userId,
    title: 'تم تأكيد طلب الحجز',
    message: depositAmount > 0
      ? `حجزك في ${shop.name} بانتظار التأكيد. العربون المتوقع: ${depositAmount} ${settings?.currency || 'ل.س'}`
      : `حجزك في ${shop.name} بانتظار تأكيد الصالون.`,
    type: NotificationType.BOOKING_UPDATED,
    data: { bookingId: booking._id, screen: 'Bookings' },
  });

  res.status(201).json(booking);
};

// Check Availability
export const getAvailability = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { staffId, date, serviceIds, timezone, branchId } = req.query;

  if (!date || !serviceIds) {
    throw new BadRequestError('date and serviceIds are required');
  }

  const [year, month, day] = (date as string).split('-').map(Number) as [number, number, number];
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = daysOfWeek[parsedDate.getUTCDay()];

  const shop = await Shop.findOne({ _id: shopId as any, isApproved: true });
  if (!shop) throw new NotFoundError('الصالون غير موجود أو غير موافق عليه');

  const servicesArray = (serviceIds as string).split(',');
  const services = await Service.find({ _id: { $in: servicesArray } });
  if (services.length !== servicesArray.length) throw new BadRequestError('One or more services not found');
  
  const totalDuration = services.reduce((acc, curr) => acc + curr.duration, 0);
  const totalBufferTime = services.reduce((acc, curr) => acc + (curr.bufferTime || 0), 0);

  if (totalDuration === 0) return res.json([]);

  let staffList: any[] = [];
  if (staffId && staffId !== 'any') {
    const staff = await Staff.findById(staffId);
    if (!staff) throw new NotFoundError('Staff not found');
    staffList = [staff];
  } else {
    const staffQuery: any = {
      shopId: shopId as string,
      servicesProvided: { $all: servicesArray },
    };
    if (branchId) {
      staffQuery.$or = [{ branchId: branchId as string }, { branchId: null }, { branchId: { $exists: false } }];
    }
    staffList = await Staff.find(staffQuery);
  }

  if (branchId && staffList.length) {
    staffList = staffList.filter(
      (s) => !s.branchId || s.branchId.toString() === String(branchId)
    );
  }

  if (staffList.length === 0) return res.json([]);

  const startOfDay = new Date(parsedDate);
  const endOfDay = new Date(parsedDate);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  const now = new Date();
  
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();
  let currentDate = now.getDate();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();

  if (timezone) {
    const options = { timeZone: timezone as string, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false };
    const formatter = new Intl.DateTimeFormat('en-US', options as any);
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    currentYear = getPart('year');
    currentMonth = getPart('month') - 1;
    currentDate = getPart('day');
    currentHour = getPart('hour');
    if (currentHour === 24) currentHour = 0;
    currentMinute = getPart('minute');
  }

  const isToday = year === currentYear && (month - 1) === currentMonth && day === currentDate;
  const currentMinsNow = currentHour * 60 + currentMinute;
  const availableSlots: { time: string, staffId: string, staffName: string }[] = [];
  const intervalStep = shop.slotInterval || 15;

  for (const staff of staffList) {
    const isBlocked = staff.blockedDates?.some(
      (d: any) => d.toISOString().split('T')[0] === parsedDate.toISOString().split('T')[0]
    );
    if (isBlocked) continue;

    const shopHours = shop.operatingHours.find(h => h.day === dayOfWeek);
    const staffHours = staff.workingHours.find((h: any) => h.day === dayOfWeek);

    if (!shopHours || shopHours.isClosed || !staffHours || staffHours.isClosed) continue;

    const openTime = shopHours.open > staffHours.open ? shopHours.open : staffHours.open;
    const closeTime = shopHours.close < staffHours.close ? shopHours.close : staffHours.close;

    if (openTime >= closeTime) continue;

    const openMins = timeToMins(openTime);
    const closeMins = timeToMins(closeTime);

    const existingBookings = await Booking.find({
      staffId: staff._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.COMPLETED] } },
        { isLocked: true, lockedUntil: { $gt: now } }
      ]
    });

    const bookedIntervals = existingBookings.map(b => ({
      start: timeToMins(b.startTime),
      end: timeToMins(b.endTime)
    }));

    if (staffHours.breaks && staffHours.breaks.length > 0) {
      staffHours.breaks.forEach((b: any) => {
        bookedIntervals.push({
          start: timeToMins(b.start),
          end: timeToMins(b.end)
        });
      });
    }

    for (let currentMins = openMins; currentMins + totalDuration <= closeMins; currentMins += intervalStep) {
      const proposedStart = currentMins;
      const proposedEnd = currentMins + totalDuration + totalBufferTime; 
      
      if (currentMins + totalDuration > closeMins) break;
      if (isToday && proposedStart <= currentMinsNow) continue;

      let hasOverlap = false;
      for (const block of bookedIntervals) {
        if (proposedStart < block.end && proposedEnd > block.start) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        const timeStr = minsToTime(proposedStart);
        if (!availableSlots.find(s => s.time === timeStr)) {
          availableSlots.push({ time: timeStr, staffId: staff._id.toString(), staffName: staff.name });
        }
      }
    }
  }

  availableSlots.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));
  res.json(availableSlots);
};

// Retrieve User Bookings
export const getMyBookings = async (req: Request, res: Response) => {
  const bookings = await Booking.find({ userId: req.user!.id as any })
    .populate('shopId', 'name address requiresDeposit depositPercent noShowFeePercent')
    .populate('branchId', 'name address')
    .populate('serviceIds', 'name price duration')
    .populate('staffId', 'name');

  res.json(bookings);
};

/**
 * User cancels own booking.
 * Free within freeCancelHours; otherwise applies cancellation fee (deposit or % of total).
 */
export const cancelMyBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.user!.id;

  const booking = await Booking.findById(bookingId).populate('shopId');
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.userId.toString() !== userId) throw new BadRequestError('Not your booking');
  if ([BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(booking.status)) {
    throw new BadRequestError('Cannot cancel this booking');
  }

  const shop = booking.shopId as any;
  const settings = await PlatformSettings.findOne({ isGlobal: true });
  const freeHours = settings?.freeCancelHours ?? 4;

  const bookingStart = new Date(booking.date);
  const [hh, mm] = booking.startTime.split(':').map(Number);
  bookingStart.setHours(hh || 0, mm || 0, 0, 0);
  const hoursUntil = (bookingStart.getTime() - Date.now()) / (1000 * 60 * 60);

  let feeCharged = 0;
  let feeType: 'none' | 'cancellation' | 'no_show' = 'none';

  if (hoursUntil < freeHours) {
    const noShowPct = shop.noShowFeePercent ?? settings?.noShowFeePercent ?? 50;
    feeCharged =
      booking.depositAmount > 0
        ? booking.depositAmount
        : Math.round((booking.totalPrice * noShowPct) / 100);
    feeType = 'cancellation';
  }

  booking.status = BookingStatus.CANCELLED;
  booking.feeCharged = feeCharged;
  booking.feeType = feeType;
  await booking.save();

  if (booking.couponId) {
    await Coupon.findByIdAndUpdate(booking.couponId, { $inc: { usedCount: -1 } });
  }

  const ownerId = shop.ownerId?.toString?.() || shop.ownerId;
  if (ownerId) {
    await sendNotification({
      recipientId: ownerId.toString(),
      title: 'إلغاء حجز',
      message:
        feeCharged > 0
          ? `أُلغي حجز في ${shop.name}. رسوم الإلغاء: ${feeCharged} ${settings?.currency || 'ل.س'}`
          : `أُلغي حجز في ${shop.name} بدون رسوم.`,
      type: NotificationType.BOOKING_UPDATED,
      data: { bookingId: booking._id, screen: 'Bookings' },
    });
  }

  res.json(booking);
};

/** Reschedule own pending/confirmed booking to a new slot */
export const rescheduleMyBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { date, startTime, endTime, staffId } = req.body;
  const userId = req.user!.id;

  if (!date || !startTime || !endTime) {
    throw new BadRequestError('التاريخ والوقت مطلوبان');
  }

  const booking = await Booking.findById(bookingId).populate('shopId');
  if (!booking) throw new NotFoundError('الحجز غير موجود');
  if (booking.userId.toString() !== userId) throw new BadRequestError('ليس حجزك');
  if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
    throw new BadRequestError('لا يمكن إعادة جدولة هذا الحجز');
  }

  const nextStaffId = staffId || booking.staffId;
  const staff = await Staff.findOne({ _id: nextStaffId, shopId: booking.shopId._id || booking.shopId });
  if (!staff) throw new NotFoundError('الموظف غير موجود');

  const parsedDate = new Date(date);
  const startOfDay = new Date(parsedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(parsedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const overlapping = await Booking.findOne({
    _id: { $ne: booking._id },
    staffId: staff._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: BookingStatus.CANCELLED },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });
  if (overlapping) {
    throw new BadRequestError('هذا الموعد محجوز، اختاري وقتاً آخر');
  }

  booking.date = parsedDate;
  booking.startTime = startTime;
  booking.endTime = endTime;
  booking.staffId = staff._id as any;
  booking.status = BookingStatus.PENDING;
  await booking.save();

  const shop = booking.shopId as any;
  const ownerId = shop.ownerId?.toString?.() || shop.ownerId;
  if (ownerId) {
    await sendNotification({
      recipientId: ownerId.toString(),
      title: 'إعادة جدولة حجز',
      message: `تم نقل حجز في ${shop.name} إلى ${startTime}`,
      type: NotificationType.BOOKING_UPDATED,
      data: { bookingId: booking._id, screen: 'Bookings' },
    });
  }

  res.json(booking);
};

/** Book multiple people together (same shop/time window, different staff/services) */
export const createGroupBooking = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { shopId, branchId, date, startTime, endTime, members } = req.body;

  if (!shopId || !date || !startTime || !endTime || !Array.isArray(members) || members.length < 2) {
    throw new BadRequestError('الحجز الجماعي يحتاج عضوين على الأقل مع التاريخ والوقت');
  }
  if (members.length > 8) {
    throw new BadRequestError('الحد الأقصى 8 أشخاص في الحجز الجماعي');
  }

  const shop = await Shop.findOne({ _id: shopId, isApproved: true });
  if (!shop) throw new NotFoundError('الصالون غير موجود أو غير موافق عليه');

  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, shopId, isActive: true });
    if (!branch) throw new BadRequestError('الفرع غير صالح');
  }

  const groupId = crypto.randomBytes(8).toString('hex');
  const created: any[] = [];

  for (const member of members) {
    const { staffId, serviceIds, guestName } = member;
    if (!staffId || !Array.isArray(serviceIds) || !serviceIds.length) {
      throw new BadRequestError('كل عضو يحتاج موظفاً وخدمات');
    }

    const staff = await Staff.findOne({ _id: staffId, shopId });
    if (!staff) throw new BadRequestError('موظف غير صالح في المجموعة');

    const parsedDate = new Date(date);
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlapping = await Booking.findOne({
      staffId: staff._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: BookingStatus.CANCELLED },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (overlapping) {
      throw new BadRequestError(`الموظف ${staff.name} غير متاح في هذا الوقت`);
    }

    const services = await Service.find({ _id: { $in: serviceIds }, shopId });
    if (services.length !== serviceIds.length) {
      throw new BadRequestError('خدمات غير صالحة في المجموعة');
    }

    const originalPrice = services.reduce((acc, s) => acc + s.price, 0);
    const booking = await Booking.create({
      userId,
      shopId,
      branchId: branchId || undefined,
      staffId: staff._id,
      serviceIds,
      date,
      startTime,
      endTime,
      groupId,
      partySize: members.length,
      guestName: guestName || undefined,
      originalPrice,
      discountAmount: 0,
      totalPrice: originalPrice,
      pointsRedeemed: 0,
      pointsEarned: Math.floor(originalPrice),
      paymentMethod: 'cash',
      depositAmount: 0,
      depositPaid: false,
      feeCharged: 0,
      feeType: 'none',
      status: BookingStatus.PENDING,
    });
    created.push(booking);
  }

  const ownerId = shop.ownerId?.toString?.() || shop.ownerId;
  if (ownerId) {
    await sendNotification({
      recipientId: ownerId.toString(),
      title: 'حجز جماعي جديد',
      message: `حجز جماعي (${members.length}) في ${shop.name} الساعة ${startTime}`,
      type: NotificationType.BOOKING_UPDATED,
      data: { groupId, screen: 'Bookings' },
    });
  }

  res.status(201).json({ groupId, bookings: created });
};

// Payment Integration — disabled (Syria cash-only)
export const createCheckoutSession = async (req: Request, res: Response) => {
  throw new BadRequestError('الدفع الإلكتروني غير متاح. الدفع نقداً في الصالون فقط.');
};

export const verifyPayment = async (req: Request, res: Response) => {
  throw new BadRequestError('الدفع الإلكتروني غير متاح. الدفع نقداً في الصالون فقط.');
};

// Slot Locking Logic
export const lockSlot = async (req: Request, res: Response) => {
  const { shopId, staffId, serviceIds, date, startTime, endTime } = req.body;
  const userId = req.user!.id;

  if (!shopId || !staffId || !serviceIds || !date || !startTime || !endTime) {
    throw new BadRequestError('Missing required fields for locking slot');
  }

  const shop = await Shop.findOne({ _id: shopId, isApproved: true });
  if (!shop) {
    throw new BadRequestError('الصالون غير موافق عليه للحجز');
  }

  const parsedDate = new Date(date);
  const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
  const now = new Date();

  const existingLock = await Booking.findOne({
    staffId,
    date: { $gte: startOfDay, $lte: endOfDay },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    $or: [
      { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.COMPLETED] } },
      { isLocked: true, lockedUntil: { $gt: now } }
    ]
  });

  if (existingLock) {
    throw new BadRequestError('This slot is no longer available');
  }

  const servicesArray = (serviceIds as string[] | string);
  const services = await Service.find({ _id: { $in: Array.isArray(servicesArray) ? servicesArray : servicesArray.split(',') } });
  const originalPrice = services.reduce((acc, curr) => acc + curr.price, 0);

  const lockedUntil = new Date(now.getTime() + 5 * 60000);

  const lockedBooking = await Booking.create({
    userId,
    shopId,
    staffId,
    serviceIds: Array.isArray(servicesArray) ? servicesArray : servicesArray.split(','),
    date,
    startTime,
    endTime,
    status: BookingStatus.PENDING,
    paymentStatus: 'pending',
    totalPrice: originalPrice,
    originalPrice,
    isLocked: true,
    lockedUntil,
  });

  res.status(201).json(lockedBooking);
};
