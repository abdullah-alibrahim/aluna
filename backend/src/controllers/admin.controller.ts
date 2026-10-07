import { Request, Response } from 'express';
import City from '../models/City';
import Category from '../models/Category';
import Shop from '../models/Shop';
import { NotFoundError, BadRequestError } from '../utils/errors';
import PlatformSettings from '../models/PlatformSettings';
import WithdrawalRequest, { WithdrawalStatus } from '../models/WithdrawalRequest';
import Payout, { PayoutStatus } from '../models/Payout';
import { sendNotification } from '../services/notification.service';
import { NotificationType } from '../models/Notification';
import Wallet from '../models/Wallet';
import Ticket, { TicketStatus } from '../models/Ticket';
import TicketMessage from '../models/TicketMessage';
import Booking from '../models/Booking';
import Banner from '../models/Banner';
import FAQ from '../models/FAQ';

import { getIO } from '../sockets';

// Cities
export const addCity = async (req: Request, res: Response) => {
  const { name, longitude, latitude } = req.body;

  const city = await City.create({
    name,
    coordinates: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  });

  res.status(201).json(city);
};

export const updateCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, longitude, latitude } = req.body;

  const city = await City.findById(id);
  if (!city) {
    throw new NotFoundError('City not found');
  }

  if (name) city.name = name;
  if (longitude !== undefined && latitude !== undefined) {
    city.coordinates = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }

  await city.save();
  res.json(city);
};

export const getCities = async (req: Request, res: Response) => {
  const cities = await City.find({ isActive: true });
  res.json(cities);
};

// Categories
export const addCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const categoryData: any = { name, description };
  if (req.file) {
    categoryData.image = req.file.path; // Cloudinary URL
  }

  const category = await Category.create(categoryData);

  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (req.file) {
    category.image = req.file.path;
  }

  await category.save();
  res.json(category);
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true });
  res.json(categories);
};

// Shops
export const getPendingShops = async (req: Request, res: Response) => {
  const shops = await Shop.find({
    $or: [{ approvalStatus: 'pending' }, { isApproved: false, approvalStatus: { $ne: 'rejected' } }],
  })
    .populate('ownerId', 'name email')
    .populate('cityId', 'name');
  res.json(shops);
};

export const getAllShops = async (req: Request, res: Response) => {
  const shops = await Shop.find().populate('ownerId', 'name email').populate('cityId', 'name');
  res.json(shops);
};

export const updateShopStatus = async (req: Request, res: Response) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    throw new BadRequestError('الحالة يجب أن تكون approved أو rejected أو pending');
  }

  const isApproved = status === 'approved';
  const update: Record<string, unknown> = {
    isApproved,
    approvalStatus: status,
  };
  if (status === 'rejected') {
    update.rejectionReason = rejectionReason || 'تم رفض الصالون من الإدارة';
  } else {
    update.$unset = { rejectionReason: 1 };
  }

  const shop = await Shop.findByIdAndUpdate(
    req.params.id,
    status === 'rejected'
      ? { isApproved, approvalStatus: status, rejectionReason: update.rejectionReason }
      : { isApproved, approvalStatus: status, $unset: { rejectionReason: 1 } },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!shop) {
    throw new NotFoundError('الصالون غير موجود');
  }

  const statusAr =
    status === 'approved' ? 'تمت الموافقة على صالونك' : status === 'rejected' ? 'تم رفض صالونك' : 'صالونك قيد المراجعة';
  const detail =
    status === 'rejected' && shop.rejectionReason
      ? `: ${shop.rejectionReason}`
      : status === 'approved'
        ? ' ويمكن للزبائن الحجز الآن.'
        : '.';

  await sendNotification({
    recipientId: shop.ownerId.toString(),
    title: 'تحديث حالة الصالون',
    message: `${statusAr}${detail}`,
    type: NotificationType.BOOKING_UPDATED,
    data: { shopId: shop._id, status, screen: 'MyShops' },
  });

  res.json(shop);
};

export const toggleShopFeatured = async (req: Request, res: Response) => {
  const { id } = req.params;
  const shop = await Shop.findById(id);

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  shop.isFeatured = !shop.isFeatured;
  await shop.save();

  res.json(shop);
};

// Platform Settings
export const getSettings = async (req: Request, res: Response) => {
  let settings = await PlatformSettings.findOne({ isGlobal: true });
  if (!settings) {
    settings = await PlatformSettings.create({ isGlobal: true });
  }
  res.json(settings);
};

export const updateSettings = async (req: Request, res: Response) => {
  const {
    platformCommissionRate,
    stripePublicKey,
    stripeSecretKey,
    currency,
    currencyCode,
    depositPercent,
    noShowFeePercent,
    freeCancelHours,
  } = req.body;
  let settings = await PlatformSettings.findOne({ isGlobal: true });
  
  if (!settings) {
    settings = new PlatformSettings({ isGlobal: true });
  }
  
  if (platformCommissionRate !== undefined) settings.platformCommissionRate = platformCommissionRate;
  if (stripePublicKey !== undefined) settings.stripePublicKey = stripePublicKey;
  if (stripeSecretKey !== undefined) settings.stripeSecretKey = stripeSecretKey;
  if (currency !== undefined) settings.currency = currency;
  if (currencyCode !== undefined) settings.currencyCode = currencyCode;
  if (depositPercent !== undefined) settings.depositPercent = depositPercent;
  if (noShowFeePercent !== undefined) settings.noShowFeePercent = noShowFeePercent;
  if (freeCancelHours !== undefined) settings.freeCancelHours = freeCancelHours;
  
  await settings.save();
  res.json(settings);
};

// Withdrawals
export const getWithdrawals = async (req: Request, res: Response) => {
  const withdrawals = await WithdrawalRequest.find().populate('ownerId', 'name email');
  res.json(withdrawals);
};

export const approveWithdrawal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body; // allow 'approved', 'rejected', 'completed'

  const withdrawal = await WithdrawalRequest.findById(id);
  if (!withdrawal) {
    throw new NotFoundError('Withdrawal request not found');
  }

  if (withdrawal.status !== WithdrawalStatus.PENDING) {
    throw new BadRequestError(`Cannot change status of a ${withdrawal.status} request`);
  }

  withdrawal.status = status;
  if (adminNote) withdrawal.adminNote = adminNote;

  if (status === WithdrawalStatus.APPROVED || status === WithdrawalStatus.COMPLETED) {
    // Balance is already deducted when request was made. Just update total withdrawn.
    const wallet = await Wallet.findOne({ ownerId: withdrawal.ownerId });
    if (!wallet) throw new NotFoundError('Owner wallet not found');
    
    wallet.totalWithdrawn += withdrawal.amount;
    await wallet.save();
  } else if (status === WithdrawalStatus.REJECTED) {
    // Refund the balance back to the owner's wallet
    const wallet = await Wallet.findOne({ ownerId: withdrawal.ownerId });
    if (wallet) {
      wallet.balance += withdrawal.amount;
      await wallet.save();
    }
  }

  await withdrawal.save();
  await withdrawal.populate('ownerId', 'name email');

  // Send Push Notification to Owner
  const statusAr =
    status === WithdrawalStatus.APPROVED || status === WithdrawalStatus.COMPLETED
      ? 'تمت الموافقة عليه'
      : status === WithdrawalStatus.REJECTED
        ? 'تم رفضه'
        : status;
  await sendNotification({
    recipientId: withdrawal.ownerId.toString(),
    title: 'تحديث طلب السحب',
    message: `طلب سحبك بمبلغ ${withdrawal.amount} ل.س ${statusAr}.`,
    type: NotificationType.PAYOUT_UPDATED,
    data: { withdrawalId: withdrawal._id, status, screen: 'Wallet' },
  });

  res.json(withdrawal);
};

// Payouts (Platform -> Owner)
export const getOwedBalances = async (req: Request, res: Response) => {
  // Find all wallets where the platform owes the owner money
  const wallets = await Wallet.find({ balance: { $gt: 0 } }).populate('ownerId', 'name email');
  
  res.json(wallets);
};

export const getPayoutHistory = async (req: Request, res: Response) => {
  const payouts = await Payout.find()
    .populate('ownerId', 'name email')
    .populate('shopId', 'name')
    .sort({ createdAt: -1 });

  res.json(payouts);
};

export const createPayout = async (req: Request, res: Response) => {
  const { ownerId, shopId, amount, referenceId, adminNote } = req.body;

  if (!ownerId || !amount) {
    throw new BadRequestError('ownerId and amount are required');
  }

  const wallet = await Wallet.findOne({ ownerId });
  if (!wallet) {
    throw new NotFoundError('Wallet not found for this owner');
  }

  if (wallet.balance < amount) {
    throw new BadRequestError(`Cannot payout $${amount}. Owner balance is only $${wallet.balance}`);
  }

  // Deduct from wallet
  wallet.balance -= amount;
  wallet.totalWithdrawn += amount;
  await wallet.save();

  // Create Payout Log
  const payoutData: any = {
    ownerId,
    amount,
    status: PayoutStatus.COMPLETED,
  };

  if (shopId) payoutData.shopId = shopId;
  if (referenceId) payoutData.referenceId = referenceId;
  if (adminNote) payoutData.adminNote = adminNote;

  const payout = await Payout.create(payoutData);

  // Send Push Notification to Owner
  await sendNotification({
    recipientId: ownerId.toString(),
    title: 'تم تحويل دفعة',
    message: `تم تسجيل دفعة بمبلغ ${amount} ل.س إلى حسابك.`,
    type: NotificationType.PAYOUT_UPDATED,
    data: { payoutId: payout._id, amount },
  });

  res.status(201).json(payout);
};

// Tickets / Disputes
export const getAllTickets = async (req: Request, res: Response) => {
  const tickets = await Ticket.find()
    .populate('userId', 'name email')
    .populate('shopId', 'name')
    .sort({ createdAt: -1 });

  res.json(tickets);
};

export const updateTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (status) ticket.status = status;
  if (adminNotes) ticket.adminNotes = adminNotes;

  await ticket.save();

  // Optionally send email/notification to user about ticket update here

  res.json(ticket);
};

export const getTicketMessages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = await TicketMessage.find({ ticketId: id as any })
    .populate('senderId', 'name email avatar')
    .sort({ createdAt: 1 });
  
  res.json(messages);
};

export const replyToTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;
  const adminId = req.user!.id; // Assuming req.user is set via protect middleware

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  const message = await TicketMessage.create({
    ticketId: id as any,
    senderId: adminId as any,
    isAdmin: true,
    text,
  });

  const populatedMessage = await TicketMessage.findById(message._id).populate('senderId', 'name email avatar');

  // Change ticket status to IN_PROGRESS if it was OPEN
  if (ticket.status === TicketStatus.OPEN) {
    ticket.status = TicketStatus.IN_PROGRESS;
    await ticket.save();
  }

  // Broadcast to ticket room
  try {
    getIO().to(`ticket_${id}`).emit('newMessage', populatedMessage);
  } catch (error) {
    console.error('Socket error emitting message:', error);
  }

  res.status(201).json(populatedMessage);
};

// Bookings
export const getAllBookings = async (req: Request, res: Response) => {
  const bookings = await Booking.find()
    .populate('userId', 'name email avatar')
    .populate('shopId', 'name address')
    .populate('serviceIds', 'name duration price')
    .populate('staffId', 'name')
    .sort({ date: -1, startTime: -1 });
    
  res.json(bookings);
};

// Banners
export const addBanner = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('Banner image is required');
  }

  const { targetLink, isActive } = req.body;

  const banner = await Banner.create({
    imageUrl: req.file.path,
    targetLink,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json(banner);
};

export const getBanners = async (req: Request, res: Response) => {
  const banners = await Banner.find().sort({ createdAt: -1 });
  res.json(banners);
};

export const toggleBannerStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const banner = await Banner.findById(id);

  if (!banner) {
    throw new NotFoundError('Banner not found');
  }

  banner.isActive = !banner.isActive;
  await banner.save();

  res.json(banner);
};

export const deleteBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Banner.findByIdAndDelete(id);
  res.json({ message: 'Banner deleted' });
};

// ==========================================
// FAQ MANAGEMENT
// ==========================================

export const addFAQ = async (req: Request, res: Response) => {
  const { question, answer, target } = req.body;
  
  if (!question || !answer || !target) {
    return res.status(400).json({ message: 'Question, answer, and target are required' });
  }

  const faq = await FAQ.create({ question, answer, target });
  res.status(201).json(faq);
};

export const getFAQs = async (req: Request, res: Response) => {
  const faqs = await FAQ.find().sort({ createdAt: -1 });
  res.status(200).json(faqs);
};

export const updateFAQ = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { question, answer, target } = req.body;

  const faq = await FAQ.findById(id);
  if (!faq) {
    return res.status(404).json({ message: 'FAQ not found' });
  }

  if (question) faq.question = question;
  if (answer) faq.answer = answer;
  if (target) faq.target = target;

  await faq.save();
  res.status(200).json(faq);
};

export const toggleFAQStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const faq = await FAQ.findById(id);
  
  if (!faq) {
    return res.status(404).json({ message: 'FAQ not found' });
  }

  faq.isActive = !faq.isActive;
  await faq.save();

  res.status(200).json(faq);
};

export const deleteFAQ = async (req: Request, res: Response) => {
  const { id } = req.params;
  const faq = await FAQ.findById(id);
  
  if (!faq) {
    return res.status(404).json({ message: 'FAQ not found' });
  }

  await faq.deleteOne();
  res.status(200).json({ message: 'FAQ removed' });
};

// Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    pendingShopsCount,
    pendingWithdrawalsCount,
    openTicketsCount,
    totalShops,
    approvedShops,
    todayBookings,
    wallets,
  ] = await Promise.all([
    Shop.countDocuments({
      $or: [{ approvalStatus: 'pending' }, { isApproved: false, approvalStatus: { $ne: 'rejected' } }],
    }),
    WithdrawalRequest.countDocuments({ status: WithdrawalStatus.PENDING }),
    Ticket.countDocuments({ status: TicketStatus.OPEN }),
    Shop.countDocuments(),
    Shop.countDocuments({ isApproved: true }),
    Booking.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Wallet.find({ balance: { $gt: 0 } }),
  ]);

  const totalOwedBalance = wallets.reduce((acc, wallet) => acc + wallet.balance, 0);

  res.json({
    pendingShops: pendingShopsCount,
    pendingWithdrawals: pendingWithdrawalsCount,
    openTickets: openTicketsCount,
    totalShops,
    approvedShops,
    todayBookings,
    totalOwedBalance,
  });
};
