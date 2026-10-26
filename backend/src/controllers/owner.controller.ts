import { Request, Response } from 'express';
import Shop from '../models/Shop';
import Branch from '../models/Branch';
import Service from '../models/Service';
import Staff from '../models/Staff';
import Booking, { BookingStatus } from '../models/Booking';
import Coupon from '../models/Coupon';
import PortfolioItem from '../models/PortfolioItem';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { cached, invalidate } from '../utils/cache';
import Wallet from '../models/Wallet';
import Transaction, { TransactionType } from '../models/Transaction';
import WithdrawalRequest, { WithdrawalStatus } from '../models/WithdrawalRequest';
import { sendNotification } from '../services/notification.service';
import { sendPushNotification } from '../utils/pushNotifications';
import { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';
import PlatformSettings from '../models/PlatformSettings';
import { uploadedImageUrl } from '../middlewares/upload';
import { buildPosSummary } from './pos.controller';


// --- Shared helpers -------------------------------------------------------
/**
 * Resolve a shop owned by the current user.
 * Unknown/invalid ids return 404 with code SHOP_NOT_FOUND so clients can
 * re-sync their stored shop id (e.g. after a demo DB reseed) instead of
 * showing a generic "Not authorized" error.
 */
async function resolveOwnedShop(shopId: string, userId: string) {
  if (!shopId || !mongoose.isValidObjectId(shopId)) {
    throw new NotFoundError('مركز التجميل غير موجود', 'SHOP_NOT_FOUND');
  }
  const shop: any = await Shop.findById(shopId).lean();
  if (!shop) throw new NotFoundError('مركز التجميل غير موجود', 'SHOP_NOT_FOUND');
  if (String(shop.ownerId) !== String(userId)) {
    throw new ForbiddenError('Not authorized', 'NOT_SHOP_OWNER');
  }
  return shop;
}

// Shops
export const createShop = async (req: Request, res: Response) => {
  const { name, description, address, cityId, categoryIds, longitude, latitude, operatingHours, slotInterval } = req.body;

  const images = req.files ? (req.files as Express.Multer.File[]).map((f) => uploadedImageUrl(f)!).filter(Boolean) : [];

  const shop = await Shop.create({
    ownerId: req.user!.id,
    name,
    description,
    address,
    cityId,
    categoryIds: JSON.parse(categoryIds || '[]'),
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    images,
    slotInterval: slotInterval ? Number(slotInterval) : 15,
    operatingHours: JSON.parse(operatingHours || '[]'),
    isApproved: false,
    approvalStatus: 'pending',
  });

  // Auto-create main branch from salon address
  await Branch.create({
    shopId: shop._id,
    name: 'الفرع الرئيسي',
    address: shop.address,
    cityId: shop.cityId,
    location: shop.location,
    operatingHours: shop.operatingHours || [],
    isMain: true,
    isActive: true,
  });

  invalidate(`shops:owner:${req.user!.id}`);
  invalidate(`dashboard:shop:${shop._id}`);
  // keep public listings/details in sync (new center may be auto-approved later)
  invalidate('shops:approved:*');
  invalidate('shop:details:*');
  res.status(201).json(shop);
};

export const getMyShops = async (req: Request, res: Response) => {
  const shops = await cached(`shops:owner:${req.user!.id}`, 60, async () => {
    return await Shop.find({ ownerId: req.user!.id }).populate('cityId', 'name').lean();
  });
  res.json(shops);
};

export const updateShop = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { name, description, address, cityId, categoryIds, longitude, latitude, operatingHours, existingImages, slotInterval } = req.body;

  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('Shop not found');
  if (shop.ownerId.toString() !== req.user!.id) throw new ForbiddenError('Not your shop');

  // Handle new images
  const newImages = req.files ? (req.files as Express.Multer.File[]).map((f) => uploadedImageUrl(f)!).filter(Boolean) : [];

  // Handle existing images passed from frontend
  let parsedExistingImages = [];
  if (existingImages) {
    parsedExistingImages = JSON.parse(existingImages);
  }

  // Combine images (limit to 5)
  const finalImages = [...parsedExistingImages, ...newImages].slice(0, 5);

  if (name) shop.name = name;
  if (description) shop.description = description;
  if (address) shop.address = address;
  if (cityId) shop.cityId = cityId;

  if (categoryIds) shop.categoryIds = JSON.parse(categoryIds);
  if (longitude && latitude) {
    shop.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };
  }
  if (operatingHours) shop.operatingHours = JSON.parse(operatingHours);
  if (slotInterval) shop.slotInterval = Number(slotInterval);
  shop.images = finalImages;

  // Editing a rejected shop re-queues it for admin review
  if (shop.approvalStatus === 'rejected') {
    shop.approvalStatus = 'pending';
    shop.isApproved = false;
    shop.set('rejectionReason', undefined);
  }

  await shop.save();
  await shop.populate('cityId', 'name');
  invalidate(`shops:owner:${req.user!.id}`);
  invalidate('shops:approved:*');
  invalidate(`shop:details:${shop._id}`);
  invalidate(`dashboard:shop:${shop._id}`);

  res.json(shop);
};

// Services
export const addService = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { categoryId, name, description, price, duration, bufferTime } = req.body;

  // Check if owner owns the shop
  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('Shop not found');
  if (shop.ownerId.toString() !== req.user!.id) throw new ForbiddenError('Not your shop');

  const serviceData: any = {
    shopId: shopId as string,
    categoryId,
    name,
    description,
    price,
    duration,
    bufferTime: bufferTime ? Number(bufferTime) : 0,
  };

  if (req.file) {
    serviceData.image = uploadedImageUrl(req.file);
  }

  const service = await Service.create(serviceData);

  invalidate(`services:shop:${shopId}:*`);
  invalidate(`analytics:shop:${shopId}`);
  invalidate(`dashboard:shop:${shopId}`);
  res.status(201).json(service);
};

export const getShopServices = async (req: Request, res: Response) => {
  const shopId = req.params.shopId || req.query.shopId;
  const parsedShopId = typeof shopId === 'string' ? shopId : (shopId as string[])?.[0];

  if (!parsedShopId) {
    throw new BadRequestError('shopId is required');
  }

  await resolveOwnedShop(parsedShopId, req.user!.id);

  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = Number(req.query.skip || 0);
  const services = await cached(`services:shop:${parsedShopId}:${limit}:${skip}`, 60, async () => {
    return await Service.find({ shopId: parsedShopId })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  });
  res.json(services);
};

export const updateService = async (req: Request, res: Response) => {
  const { shopId, serviceId } = req.params;
  const { categoryId, name, description, price, duration, isActive, bufferTime } = req.body;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not your shop');
  }

  const service = await Service.findOne({ _id: serviceId as any, shopId: shopId as any });
  if (!service) throw new NotFoundError('Service not found');

  if (categoryId) service.categoryId = categoryId;
  if (name) service.name = name;
  if (description) service.description = description;
  if (price !== undefined) service.price = Number(price);
  if (duration !== undefined) service.duration = Number(duration);
  if (bufferTime !== undefined) (service as any).bufferTime = Number(bufferTime);

  if (req.file) {
    service.image = uploadedImageUrl(req.file)!;
  }

  await service.save();
  await service.populate('categoryId', 'name');

  invalidate(`services:shop:${shopId}:*`);
  invalidate(`analytics:shop:${shopId}`);
  invalidate(`dashboard:shop:${shopId}`);
  res.json(service);
};

export const deleteService = async (req: Request, res: Response) => {
  const { shopId, serviceId } = req.params;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not your shop');
  }

  const service = await Service.findOne({ _id: serviceId as any, shopId: shopId as any });
  if (!service) throw new NotFoundError('Service not found');

  await service.deleteOne();

  invalidate(`services:shop:${shopId}:*`);
  invalidate(`analytics:shop:${shopId}`);
  invalidate(`dashboard:shop:${shopId}`);
  res.json({ message: 'Service deleted successfully' });
};

// Bookings
export const getShopBookings = async (req: Request, res: Response) => {
  let shopId = req.params.shopId || req.query.shopId;
  const parsedShopId = typeof shopId === 'string' ? shopId : (shopId as string[])?.[0];

  const shop = await Shop.findById(parsedShopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = Number(req.query.skip || 0);
  const statusFilter = (req.query.status as string) || 'all';

  const query: Record<string, unknown> = { shopId: parsedShopId as string };
  if (statusFilter && statusFilter !== 'all') query.status = statusFilter;

  const bookings = await cached(`bookings:shop:${parsedShopId}:${statusFilter}:${limit}:${skip}`, 30, async () => {
    return await Booking.find(query)
      .select('userId guestName groupId date startTime status totalPrice serviceIds staffId pointsEarned createdAt')
      .populate('userId', 'name phone')
      .populate('serviceIds', 'name price duration')
      .populate('staffId', 'name')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  });
  res.json(bookings);
};

/**
 * All bookings across every shop the owner has — one request instead of N.
 * Supports status/shop filters and pagination; cached briefly and invalidated
 * whenever a booking status changes.
 */
export const getMyBookings = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = Number(req.query.skip || 0);
  const statusFilter = (req.query.status as string) || 'all';
  const shopFilter = (req.query.shopId as string) || 'all';

  const shops = await Shop.find({ ownerId: req.user!.id }).select('_id name').lean();
  if (!shops.length) {
    res.json([]);
    return;
  }

  const ownedIds = shops.map((s: any) => s._id);
  const query: Record<string, unknown> = {
    shopId: shopFilter !== 'all' && mongoose.isValidObjectId(shopFilter) ? shopFilter : { $in: ownedIds },
  };
  if (statusFilter !== 'all') query.status = statusFilter;

  const key = `bookings:owner:${req.user!.id}:${shopFilter}:${statusFilter}:${limit}:${skip}`;
  const bookings = await cached(key, 20, async () =>
    Booking.find(query)
      .select('shopId userId guestName groupId date startTime status totalPrice serviceIds staffId pointsEarned createdAt')
      .populate('shopId', 'name')
      .populate('userId', 'name phone')
      .populate('serviceIds', 'name price')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  );

  res.json(bookings);
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'confirmed', 'completed', 'cancelled'

  const booking = await Booking.findById(id).populate('shopId');

  if (!booking) throw new NotFoundError('Booking not found');

  const shop = booking.shopId as any;
  const isAdmin = (req.user as any)?.role === 'admin';
  if (!isAdmin && shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  const wasCompleted = booking.status === BookingStatus.COMPLETED;

  const allowed = ['confirmed', 'completed', 'cancelled', 'no_show', 'pending'];
  if (!allowed.includes(status)) {
    throw new BadRequestError('Invalid booking status');
  }

  // Handle Loyalty Points Logic
  if (booking.status !== BookingStatus.COMPLETED && status === BookingStatus.COMPLETED) {
    await mongoose.model('User').findByIdAndUpdate(booking.userId, {
      $inc: { loyaltyPoints: booking.pointsEarned }
    });
  } else if (booking.status === BookingStatus.COMPLETED && status === BookingStatus.CANCELLED) {
    await mongoose.model('User').findByIdAndUpdate(booking.userId, {
      $inc: { loyaltyPoints: -booking.pointsEarned }
    });
  }

  if (booking.status !== BookingStatus.CANCELLED && status === BookingStatus.CANCELLED) {
    if (booking.couponId) {
      await Coupon.findByIdAndUpdate(booking.couponId, {
        $inc: { usedCount: -1 }
      });
    }
  }

  if (status === BookingStatus.NO_SHOW && booking.status !== BookingStatus.NO_SHOW) {
    const settings = await PlatformSettings.findOne({ isGlobal: true });
    const pct = shop.noShowFeePercent ?? settings?.noShowFeePercent ?? 50;
    const fee =
      booking.depositAmount > 0
        ? booking.depositAmount
        : Math.round((booking.totalPrice * pct) / 100);
    booking.feeCharged = fee;
    booking.feeType = 'no_show';
  }

  booking.status = status;
  await booking.save();

  // Owner earnings: credit the shop owner's wallet when a booking is completed,
  // and reverse it if the booking is later reopened/cancelled.
  if (!wasCompleted && status === BookingStatus.COMPLETED && !booking.ownerCredited) {
    const settings = await PlatformSettings.findOne({ isGlobal: true });
    const rate = Number(settings?.platformCommissionRate ?? 10);
    const net = Math.max(0, Math.round((booking.totalPrice * (100 - rate)) / 100));

    let wallet = await Wallet.findOne({ ownerId: shop.ownerId });
    if (!wallet) {
      wallet = await Wallet.create({ ownerId: shop.ownerId });
    }

    if (net > 0) {
      wallet.balance += net;
      wallet.totalEarnings += net;
      await wallet.save();

      await Transaction.create({
        ownerId: shop.ownerId,
        shopId: shop._id,
        bookingId: booking._id,
        type: TransactionType.EARNING,
        amount: net,
        balanceAfter: wallet.balance,
        description: `أرباح حجز مكتمل في ${shop.name}`,
      }).catch(() => {});

      booking.ownerCredited = true;
      booking.ownerEarnings = net;
      booking.paymentStatus = 'paid';
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { ownerCredited: true, ownerEarnings: net, paymentStatus: 'paid' } }
      );

      await sendNotification({
        recipientId: shop.ownerId.toString(),
        title: 'أرباح جديدة',
        message: `أُضيف ${net.toLocaleString('en-US')} ل.س إلى محفظتك من حجز مكتمل في ${shop.name}`,
        type: NotificationType.PAYMENT_RECEIVED,
        data: { bookingId: booking._id, shopId: shop._id, screen: 'Wallet' },
      });

      const ownerUser = await mongoose.model('User').findById(shop.ownerId);
      if (ownerUser?.pushToken) {
        await sendPushNotification(
          ownerUser.pushToken,
          'أرباح جديدة',
          `أُضيف ${net.toLocaleString('en-US')} ل.س إلى محفظتك`,
          { screen: 'Wallet' }
        );
      }
    }
  } else if (wasCompleted && status !== BookingStatus.COMPLETED && booking.ownerCredited) {
    const wallet = await Wallet.findOne({ ownerId: shop.ownerId });
    const credited = Number(booking.ownerEarnings) || 0;

    if (wallet) {
      wallet.balance = Math.max(0, wallet.balance - credited);
      wallet.totalEarnings = Math.max(0, wallet.totalEarnings - credited);
      await wallet.save();

      await Transaction.create({
        ownerId: shop.ownerId,
        shopId: shop._id,
        bookingId: booking._id,
        type: TransactionType.REFUND,
        amount: -credited,
        balanceAfter: wallet.balance,
        description: `إلغاء عرض أرباح حجز مكتمل في ${shop.name}`,
      }).catch(() => {});
    }

    booking.ownerCredited = false;
    booking.ownerEarnings = 0;
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { ownerCredited: false, ownerEarnings: 0 } }
    );
  }

  const statusAr: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكّد',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    no_show: 'عدم حضور',
  };
  const label = statusAr[status] || status;

  await sendNotification({
    recipientId: booking.userId.toString(),
    title: 'تحديث الحجز',
    message: `حجزك في ${shop.name} أصبح: ${label}`,
    type: NotificationType.BOOKING_UPDATED,
    data: { bookingId: booking._id, status: booking.status, screen: 'Bookings' },
  });

  const userToNotify = await mongoose.model('User').findById(booking.userId);
  if (userToNotify?.pushToken) {
    await sendPushNotification(
      userToNotify.pushToken,
      'تحديث الحجز',
      `حجزك في ${shop.name} أصبح: ${label}`,
      { screen: 'Bookings' }
    );
  }

  // `booking.shopId` is populated here, so use the document id for cache keys.
  const shopKey = String(shop._id || booking.shopId);
  invalidate(`bookings:shop:${shopKey}:*`);
  invalidate(`bookings:owner:${shop.ownerId}:*`);
  invalidate(`analytics:shop:${shopKey}`);
  invalidate(`dashboard:shop:${shopKey}`);
  invalidate(`pos:summary:${shopKey}`);
  invalidate(`wallet:owner:${shop.ownerId}`);
  invalidate(`wallettx:owner:${shop.ownerId}:*`);
  res.json(booking);
};

// Wallet
export const getWalletTransactions = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = Number(req.query.skip || 0);
  const type = req.query.type as string | undefined;

  const filter: any = { ownerId: req.user!.id };
  if (type) filter.type = type;

  const transactions = await cached(`wallettx:owner:${req.user!.id}:${limit}:${skip}:${type || 'all'}`, 10, async () =>
    Transaction.find(filter)
      .populate('shopId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  );

  res.json(transactions);
};

export const getMyWallet = async (req: Request, res: Response) => {
  let wallet = await Wallet.findOne({ ownerId: req.user!.id });

  if (!wallet) {
    wallet = await Wallet.create({ ownerId: req.user!.id });
  }

  const data = await cached(`wallet:owner:${req.user!.id}`, 10, async () => {
    const withdrawals = await WithdrawalRequest.find({ ownerId: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();
    return {
      wallet,
      withdrawals,
    };
  });
  res.json(data);
};

export const requestWithdrawal = async (req: Request, res: Response) => {
  const { amount, payoutDetails } = req.body;
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount < 1 || !payoutDetails) {
    throw new BadRequestError('المبلغ وتفاصيل التحويل مطلوبان');
  }

  const pendingRequest = await WithdrawalRequest.findOne({
    ownerId: req.user!.id,
    status: WithdrawalStatus.PENDING as any,
  });
  if (pendingRequest) {
    throw new BadRequestError('لديك طلب سحب قيد المراجعة بالفعل');
  }

  // Atomic debit prevents double-spend under concurrent requests
  const wallet = await Wallet.findOneAndUpdate(
    { ownerId: req.user!.id, balance: { $gte: numericAmount } },
    { $inc: { balance: -numericAmount } },
    { new: true }
  );

  if (!wallet) {
    throw new BadRequestError('الرصيد غير كافٍ');
  }

  try {
    await Transaction.create({
      ownerId: req.user!.id,
      type: TransactionType.WITHDRAWAL,
      amount: -numericAmount,
      balanceAfter: wallet.balance,
      description: `طلب سحب مبلغ ${numericAmount.toLocaleString()}`,
    }).catch(() => {});

    const request = await WithdrawalRequest.create({
      ownerId: req.user!.id,
      amount: numericAmount,
      payoutDetails,
    });
    invalidate(`wallet:owner:${req.user!.id}`);
    invalidate(`wallettx:owner:${req.user!.id}:*`);
    res.status(201).json(request);
  } catch (err) {
    await Wallet.findOneAndUpdate(
      { ownerId: req.user!.id },
      { $inc: { balance: numericAmount } }
    );
    throw err;
  }
};

// Coupons
export const createCoupon = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { code, discountPercentage, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

  const shop = await resolveOwnedShop(shopId as string, req.user!.id);

  // Ensure code is unique for this shop
  const existing = await Coupon.findOne({ code: code.toUpperCase(), shopId: shopId as string });
  if (existing) {
    throw new BadRequestError('Coupon code already exists for this shop');
  }

  const coupon = await Coupon.create({
    shopId: shopId as string,
    code,
    discountPercentage,
    maxDiscount,
    expiryDate,
    usageLimit,
    isActive: isActive !== undefined ? isActive : true,
  });

  invalidate(`coupons:shop:${shopId}`);
  res.status(201).json(coupon);
};

export const getShopCoupons = async (req: Request, res: Response) => {
  const { shopId } = req.params;

  const shop = await resolveOwnedShop(shopId as string, req.user!.id);

  const coupons = await cached(`coupons:shop:${shopId}`, 30, async () =>
    Coupon.find({ shopId: shopId as string }).sort({ createdAt: -1 }).lean()
  );
  res.json(coupons);
};

export const updateCoupon = async (req: Request, res: Response) => {
  const { shopId, couponId } = req.params;
  const updates = req.body;

  const shop = await resolveOwnedShop(shopId as string, req.user!.id);

  // Prevent code duplication
  if (updates.code) {
    const existing = await Coupon.findOne({ _id: { $ne: couponId as string }, code: updates.code.toUpperCase(), shopId: shopId as string });
    if (existing) {
      throw new BadRequestError('Coupon code already exists for this shop');
    }
    updates.code = updates.code.toUpperCase();
  }

  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId as string, shopId: shopId as string },
    updates,
    { new: true, runValidators: true }
  );

  if (!coupon) throw new NotFoundError('Coupon not found');

  invalidate(`coupons:shop:${shopId}`);
  res.json(coupon);
};

export const deleteCoupon = async (req: Request, res: Response) => {
  const { shopId, couponId } = req.params;

  const shop = await resolveOwnedShop(shopId as string, req.user!.id);

  const coupon = await Coupon.findOneAndDelete({ _id: couponId as string, shopId: shopId as string });
  if (!coupon) throw new NotFoundError('Coupon not found');

  invalidate(`coupons:shop:${shopId}`);
  res.json({ message: 'Coupon deleted successfully' });
};

// Staff
export const addStaff = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { name, role, servicesProvided, workingHours, globalBreakStart, globalBreakEnd, branchId } = req.body;

  const shop = await resolveOwnedShop(shopId as string, req.user!.id);

  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, shopId: shopId as string, isActive: true });
    if (!branch) throw new BadRequestError('الفرع غير صالح');
  }

  let finalWorkingHours = workingHours ? JSON.parse(workingHours) : shop.operatingHours;
  if (globalBreakStart && globalBreakEnd) {
    finalWorkingHours = finalWorkingHours.map((h: any) => ({
      ...h,
      breaks: [{ start: globalBreakStart, end: globalBreakEnd }]
    }));
  }

  const staffData: any = {
    shopId: shopId as string,
    name,
    role,
    branchId: branchId || undefined,
    servicesProvided: servicesProvided ? JSON.parse(servicesProvided) : [],
    workingHours: finalWorkingHours,
  };

  if (req.file) {
    staffData.avatar = uploadedImageUrl(req.file);
  }

  const staff = await Staff.create(staffData);

  res.status(201).json(staff);
};

export const getShopStaff = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  await resolveOwnedShop(shopId as string, req.user!.id);

  const staff = await cached(`staff:shop:${shopId}`, 30, async () =>
    Staff.find({ shopId: shopId as string })
      .populate('servicesProvided', 'name')
      .populate('branchId', 'name isMain')
      .lean()
  );
  res.json(staff);
};

export const updateStaff = async (req: Request, res: Response) => {
  const { shopId, staffId } = req.params;
  const { name, role, servicesProvided, workingHours, branchId } = req.body;

  const staff = await Staff.findOne({ _id: staffId as string, shopId: shopId as string }).populate('shopId');
  if (!staff) {
    throw new NotFoundError('Staff not found');
  }

  if (branchId !== undefined) {
    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, shopId: shopId as string, isActive: true });
      if (!branch) throw new BadRequestError('الفرع غير صالح');
      staff.branchId = branchId as any;
    } else {
      staff.set('branchId', undefined);
    }
  }

  const shop = staff.shopId as any;
  if (shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  if (name !== undefined) staff.name = name;
  if (role !== undefined) staff.role = role;

  if (servicesProvided !== undefined) {
    try {
      staff.servicesProvided = typeof servicesProvided === 'string' ? JSON.parse(servicesProvided) : servicesProvided;
    } catch (e) { }
  }

  const { globalBreakStart, globalBreakEnd } = req.body;

  if (workingHours !== undefined) {
    try {
      let parsed = typeof workingHours === 'string' ? JSON.parse(workingHours) : workingHours;
      if (globalBreakStart && globalBreakEnd) {
        parsed = parsed.map((h: any) => ({
          ...h,
          breaks: [{ start: globalBreakStart, end: globalBreakEnd }]
        }));
      }
      staff.workingHours = parsed;
    } catch (e) { }
  } else if (globalBreakStart && globalBreakEnd) {
    // If working hours not provided but breaks are, update existing hours
    staff.workingHours = staff.workingHours.map((h: any) => {
      // Need to convert Mongoose subdocument to object to modify it easily
      const hObj = h.toObject ? h.toObject() : h;
      return {
        ...hObj,
        breaks: [{ start: globalBreakStart, end: globalBreakEnd }]
      };
    });
  }

  if (req.file) {
    staff.avatar = uploadedImageUrl(req.file)!;
  }

  await staff.save();
  await staff.populate('servicesProvided', 'name');

  invalidate(`staff:shop:${shopId}`);
  invalidate(`dashboard:shop:${shopId}`);
  res.json(staff);
};

export const deleteStaff = async (req: Request, res: Response) => {
  const { shopId, staffId } = req.params;

  const staff = await Staff.findOne({ _id: staffId as string, shopId: shopId as string }).populate('shopId');
  if (!staff) {
    throw new NotFoundError('Staff not found');
  }

  const shop = staff.shopId as any;
  if (shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  await Staff.findByIdAndDelete(staffId);

  invalidate(`staff:shop:${shopId}`);
  invalidate(`dashboard:shop:${shopId}`);
  res.json({ message: 'Staff deleted successfully' });
};


// Analytics
export async function buildShopAnalytics(shopId: string) {
  const shopObjId = new mongoose.Types.ObjectId(shopId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  // 1. Monthly Revenue Pipeline
  const revenuePipeline = Booking.aggregate([
    {
      $match: {
        shopId: shopObjId,
        status: BookingStatus.COMPLETED,
        date: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' }
      }
    }
  ]);

  // 2. Top Performing Services Pipeline
  const topServicesPipeline = Booking.aggregate([
    {
      $match: {
        shopId: shopObjId,
        status: BookingStatus.COMPLETED
      }
    },
    { $unwind: '$serviceIds' },
    {
      $group: {
        _id: '$serviceIds',
        count: { $sum: 1 },
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    { $unwind: '$serviceDetails' },
    {
      $project: {
        name: '$serviceDetails.name',
        count: 1
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // 3. Cancellation Rate Pipeline
  const cancellationPipeline = Booking.aggregate([
    {
      $match: {
        shopId: shopObjId,
        date: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', BookingStatus.CANCELLED] }, 1, 0] }
        }
      }
    }
  ]);

  // 4. Upcoming Appointments
  const upcomingCountPromise = Booking.countDocuments({
    shopId: shopObjId,
    date: { $gte: today },
    status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
  });

  // Execute all queries concurrently
  const [revenueResult, topServices, cancellationResult, upcomingAppointments] = await Promise.all([
    revenuePipeline,
    topServicesPipeline,
    cancellationPipeline,
    upcomingCountPromise
  ]);

  const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  let cancellationRate = 0;
  if (cancellationResult.length > 0 && cancellationResult[0].totalBookings > 0) {
    cancellationRate = (cancellationResult[0].cancelledBookings / cancellationResult[0].totalBookings) * 100;
  }

  return {
    monthlyRevenue,
    topServices,
    cancellationRate: parseFloat(cancellationRate.toFixed(2)),
    upcomingAppointments
  };
}

export const getShopAnalytics = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  await resolveOwnedShop(shopId as string, req.user!.id);
  const data = await cached(`analytics:shop:${shopId}`, 20, () => buildShopAnalytics(shopId as string));
  res.json(data);
};

// Aggregated dashboard payload — one round-trip instead of six.
export const getShopDashboard = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  await resolveOwnedShop(shopId as string, req.user!.id);

  const data = await cached(`dashboard:shop:${shopId}`, 20, async () => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [shop, analytics, pos, bookings, upcoming, staff, branches] = await Promise.all([
      Shop.findById(shopId)
        .select('-ownerId -rejectionReason -__v')
        .populate('cityId', 'name')
        .lean(),
      buildShopAnalytics(shopId as string),
      buildPosSummary(shopId as string),
      Booking.find({ shopId: shopId as string })
        .select('userId guestName date startTime status totalPrice serviceIds')
        .populate('userId', 'name')
        .sort({ date: -1, startTime: -1 })
        .limit(30)
        .lean(),
      Booking.find({
        shopId: shopId as string,
        date: { $gte: today },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      })
        .select('userId guestName date startTime status totalPrice serviceIds')
        .populate('userId', 'name')
        .sort({ date: 1, startTime: 1 })
        .limit(10)
        .lean(),
      Staff.find({ shopId: shopId as string })
        .select('name role avatar branchId isActive')
        .lean(),
      Branch.find({ shopId: shopId as string })
        .select('name isMain isActive address')
        .sort({ isMain: -1, createdAt: 1 })
        .lean(),
    ]);

    return { shop, analytics, pos, bookings, upcoming, staff, branches };
  });

  res.json(data);
};

// Portfolio
export const addPortfolioItem = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { caption, serviceId, staffId } = req.body;

  const shop = await resolveOwnedShop(shopId as string, req.user!.id);

  if (!req.file) {
    throw new BadRequestError('Image file is required');
  }

  const portfolioData: any = {
    shopId: shopId as string,
    imageUrl: uploadedImageUrl(req.file)!,
  };

  if (caption) portfolioData.caption = caption;
  if (serviceId) portfolioData.serviceId = serviceId;
  if (staffId) portfolioData.staffId = staffId;

  const portfolioItem = await PortfolioItem.create(portfolioData);

  res.status(201).json(portfolioItem);
};

export const deletePortfolioItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  const portfolioItem = await PortfolioItem.findById(id).populate('shopId');
  if (!portfolioItem) {
    throw new NotFoundError('Portfolio item not found');
  }

  const shop = portfolioItem.shopId as any;
  if (shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  await PortfolioItem.findByIdAndDelete(id);

  res.json({ message: 'Portfolio item deleted successfully' });
};


