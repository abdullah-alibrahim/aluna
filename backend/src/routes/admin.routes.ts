import express from 'express';
import {
  addCity,
  updateCity,
  getCities,
  addCategory,
  updateCategory,
  getCategories,
  getPendingShops,
  getAllShops,
  updateShopStatus,
  getSettings,
  updateSettings,
  getWithdrawals,
  approveWithdrawal,
  getOwedBalances,
  getPayoutHistory,
  createPayout,
  getAllTickets,
  updateTicket,
  getTicketMessages,
  replyToTicket,
  getAllBookings,
  toggleShopFeatured,
  addBanner,
  getBanners,
  toggleBannerStatus,
  deleteBanner,
  getDashboardStats,
  addFAQ,
  getFAQs,
  updateFAQ,
  toggleFAQStatus,
  deleteFAQ,
} from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';
import { upload } from '../middlewares/upload';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

// All admin routes are protected and restricted to ADMIN role
router.use(protect, authorize(UserRole.ADMIN));

router.get('/dashboard-stats', catchAsync(getDashboardStats));

router.route('/cities')
  .post(catchAsync(addCity))
  .get(catchAsync(getCities));
  
router.put('/cities/:id', catchAsync(updateCity));

router.route('/categories')
  .post(upload.single('image'), catchAsync(addCategory))
  .get(catchAsync(getCategories));

router.put('/categories/:id', upload.single('image'), catchAsync(updateCategory));

router.get('/shops', catchAsync(getAllShops));
router.get('/shops/pending', catchAsync(getPendingShops));
router.patch('/shops/:id/status', catchAsync(updateShopStatus));
router.patch('/shops/:id/featured', catchAsync(toggleShopFeatured));

// Settings
router.route('/settings')
  .get(catchAsync(getSettings))
  .put(catchAsync(updateSettings));

// Withdrawals
router.route('/withdrawals')
  .get(catchAsync(getWithdrawals));
router.patch('/withdrawals/:id/approve', catchAsync(approveWithdrawal));

// Finances & Payouts
router.get('/finances/owed', catchAsync(getOwedBalances));
router.route('/finances/payouts')
  .get(catchAsync(getPayoutHistory))
  .post(catchAsync(createPayout));

// Tickets
router.route('/tickets')
  .get(catchAsync(getAllTickets));
router.patch('/tickets/:id', catchAsync(updateTicket));
router.get('/tickets/:id/messages', catchAsync(getTicketMessages));
router.post('/tickets/:id/messages', catchAsync(replyToTicket));

// Bookings
router.get('/bookings', catchAsync(getAllBookings));

// Banners
router.route('/banners')
  .post(upload.single('image'), catchAsync(addBanner))
  .get(catchAsync(getBanners));
router.patch('/banners/:id/toggle', catchAsync(toggleBannerStatus));
router.delete('/banners/:id', catchAsync(deleteBanner));

// FAQs
router.route('/faqs')
  .post(catchAsync(addFAQ))
  .get(catchAsync(getFAQs));
router.put('/faqs/:id', catchAsync(updateFAQ));
router.patch('/faqs/:id/toggle', catchAsync(toggleFAQStatus));
router.delete('/faqs/:id', catchAsync(deleteFAQ));

export default router;
