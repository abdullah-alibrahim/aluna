
import express from 'express';
import {
  getApprovedShops,
  getShopDetails,
  toggleFavoriteShop,
  getMyFavorites,
  getShopPortfolio,
  getActiveBanners,
} from '../controllers/shop.controller';
import {
  createBooking,
  getMyBookings,
  cancelMyBooking,
  rescheduleMyBooking,
  createGroupBooking,
  getAvailability,
  createCheckoutSession,
  verifyPayment,
  lockSlot,
} from '../controllers/booking.controller';
import { listPublicBranches } from '../controllers/branch.controller';
import {
  getCoupons,
  collectCoupon,
} from '../controllers/coupon.controller';
import {
  createTicket,
  getMyTickets,
  getTicketMessages,
  sendTicketMessage,
} from '../controllers/ticket.controller';
import { getCategories } from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

// Shops & Availability & Portfolio
router.get('/shops', catchAsync(getApprovedShops));
router.get('/shops/:id', catchAsync(getShopDetails));
router.get('/shops/:shopId/availability', catchAsync(getAvailability));
router.get('/shops/:shopId/branches', catchAsync(listPublicBranches));
router.get('/shops/:shopId/portfolio', catchAsync(getShopPortfolio));

// Banners & Categories
router.get('/banners', catchAsync(getActiveBanners));
router.get('/categories', catchAsync(getCategories));

// Protected routes (USER and OWNER roles)
router.use(protect, authorize(UserRole.USER, UserRole.OWNER));

router.route('/bookings')
  .post(catchAsync(createBooking))
  .get(catchAsync(getMyBookings));

router.post('/bookings/group', catchAsync(createGroupBooking));
router.post('/bookings/:bookingId/cancel', catchAsync(cancelMyBooking));
router.post('/bookings/:bookingId/reschedule', catchAsync(rescheduleMyBooking));
router.post('/bookings/lock-slot', catchAsync(lockSlot));

// Payments
router.post('/bookings/:bookingId/checkout', catchAsync(createCheckoutSession));
router.post('/bookings/:bookingId/verify-payment', catchAsync(verifyPayment));

// Favorites
router.post('/shops/:shopId/favorite', catchAsync(toggleFavoriteShop));
router.get('/favorites', catchAsync(getMyFavorites));

// Tickets / Support
router.route('/tickets')
  .post(catchAsync(createTicket))
  .get(catchAsync(getMyTickets));

router.route('/tickets/:id/messages')
  .get(catchAsync(getTicketMessages))
  .post(catchAsync(sendTicketMessage));

// Coupons
router.get('/coupons', catchAsync(getCoupons));
router.post('/coupons/:couponId/collect', catchAsync(collectCoupon));

export default router;
