import { Request, Response } from 'express';
import Shop from '../models/Shop';
import Branch from '../models/Branch';
import Service from '../models/Service';
import Staff from '../models/Staff';
import Booking, { BookingStatus } from '../models/Booking';
import Coupon from '../models/Coupon';
import PortfolioItem from '../models/PortfolioItem';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import Wallet from '../models/Wallet';
import WithdrawalRequest, { WithdrawalStatus } from '../models/WithdrawalRequest';
import { sendNotification } from '../services/notification.service';
import { sendPushNotification } from '../utils/pushNotifications';
import { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';
import PlatformSettings from '../models/PlatformSettings';

// Shops
export const createShop = async (req: Request, res: Response) => {
  const { name, description, address, cityId, categoryIds, longitude, latitude, operatingHours, slotInterval } = req.body;

  const images = req.files ? (req.files as Express.Multer.File[]).map((f) => f.path) : [];

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

  res.status(201).json(shop);
};

export const getMyShops = async (req: Request, res: Response) => {
  const shops = await Shop.find({ ownerId: req.user!.id }).populate('cityId', 'name');
  res.json(shops);
};

export const updateShop = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { name, description, address, cityId, categoryIds, longitude, latitude, operatingHours, existingImages, slotInterval } = req.body;

  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('Shop not found');
  if (shop.ownerId.toString() !== req.user!.id) throw new ForbiddenError('Not your shop');

  // Handle new images
  const newImages = req.files ? (req.files as Express.Multer.File[]).map((f) => f.path) : [];

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
    serviceData.image = req.file.path;
  }

  const service = await Service.create(serviceData);

  res.status(201).json(service);
};

export const getShopServices = async (req: Request, res: Response) => {
  const shopId = req.params.shopId || req.query.shopId;
  const parsedShopId = typeof shopId === 'string' ? shopId : (shopId as string[])?.[0];

  if (!parsedShopId) {
    throw new BadRequestError('shopId is required');
  }

  const shop = await Shop.findById(parsedShopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized to view these services');
  }

  const services = await Service.find({ shopId: parsedShopId }).populate('categoryId', 'name');
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
    service.image = req.file.path;
  }

  await service.save();
  await service.populate('categoryId', 'name');

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

  const bookings = await Booking.find({ shopId: parsedShopId as string })
    .populate('userId', 'name email phone')
    .populate('serviceIds', 'name price duration')
    .populate('staffId', 'name');

  res.json(bookings);
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'confirmed', 'completed', 'cancelled'

  const booking = await Booking.findById(id).populate('shopId');

  if (!booking) throw new NotFoundError('Booking not found');

  const shop = booking.shopId as any;
  if (shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

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

  res.json(booking);
};

// Wallet
export const getMyWallet = async (req: Request, res: Response) => {
  let wallet = await Wallet.findOne({ ownerId: req.user!.id });

  if (!wallet) {
    wallet = await Wallet.create({ ownerId: req.user!.id });
  }

  const withdrawals = await WithdrawalRequest.find({ ownerId: req.user!.id }).sort({ createdAt: -1 });

  res.json({
    wallet,
    withdrawals,
  });
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
    const request = await WithdrawalRequest.create({
      ownerId: req.user!.id,
      amount: numericAmount,
      payoutDetails,
    });
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

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

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

  res.status(201).json(coupon);
};

export const getShopCoupons = async (req: Request, res: Response) => {
  const { shopId } = req.params;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  const coupons = await Coupon.find({ shopId: shopId as string }).sort({ createdAt: -1 });
  res.json(coupons);
};

export const updateCoupon = async (req: Request, res: Response) => {
  const { shopId, couponId } = req.params;
  const updates = req.body;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

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

  res.json(coupon);
};

export const deleteCoupon = async (req: Request, res: Response) => {
  const { shopId, couponId } = req.params;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  const coupon = await Coupon.findOneAndDelete({ _id: couponId as string, shopId: shopId as string });
  if (!coupon) throw new NotFoundError('Coupon not found');

  res.json({ message: 'Coupon deleted successfully' });
};

// Staff
export const addStaff = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { name, role, servicesProvided, workingHours, globalBreakStart, globalBreakEnd, branchId } = req.body;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

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
    staffData.avatar = req.file.path;
  }

  const staff = await Staff.create(staffData);

  res.status(201).json(staff);
};

export const getShopStaff = async (req: Request, res: Response) => {
  const { shopId } = req.params;

  const staff = await Staff.find({ shopId: shopId as string })
    .populate('servicesProvided', 'name')
    .populate('branchId', 'name isMain');
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
    staff.avatar = req.file.path;
  }

  await staff.save();
  await staff.populate('servicesProvided', 'name');

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

  res.json({ message: 'Staff deleted successfully' });
};


// Analytics
export const getShopAnalytics = async (req: Request, res: Response) => {
  const { shopId } = req.params;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  const shopObjId = new mongoose.Types.ObjectId(shopId as string);
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

  res.json({
    monthlyRevenue,
    topServices,
    cancellationRate: parseFloat(cancellationRate.toFixed(2)),
    upcomingAppointments
  });
};

// Portfolio
export const addPortfolioItem = async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { caption, serviceId, staffId } = req.body;

  const shop = await Shop.findById(shopId);
  if (!shop || shop.ownerId.toString() !== req.user!.id) {
    throw new ForbiddenError('Not authorized');
  }

  if (!req.file) {
    throw new BadRequestError('Image file is required');
  }

  const portfolioData: any = {
    shopId: shopId as string,
    imageUrl: req.file.path,
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


