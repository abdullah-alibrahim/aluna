import express from 'express';
import {
  createShop,
  getMyShops,
  addService,
  getShopServices,
  updateService,
  deleteService,
  getShopBookings,
  updateBookingStatus,
  getMyWallet,
  requestWithdrawal,
  createCoupon,
  getShopCoupons,
  updateCoupon,
  deleteCoupon,
  addStaff,
  getShopStaff,
  getShopAnalytics,
  addPortfolioItem,
  deletePortfolioItem,
  updateShop,
  updateStaff,
  deleteStaff,
} from '../controllers/owner.controller';
import {
  listOwnerBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branch.controller';
import {
  createPosInvoice,
  listInvoices,
  getInvoice,
  createExpense,
  listExpenses,
  deleteExpense,
  posSummary,
} from '../controllers/pos.controller';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';
import { upload } from '../middlewares/upload';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.use(protect, authorize(UserRole.OWNER));

// Shops
router.route('/shops')
  .post(upload.array('images', 5), catchAsync(createShop))
  .get(catchAsync(getMyShops));

router.route('/shops/:shopId')
  .patch(upload.array('images', 5), catchAsync(updateShop));

// Branches
router.route('/shops/:shopId/branches')
  .get(catchAsync(listOwnerBranches))
  .post(catchAsync(createBranch));
router.patch('/shops/:shopId/branches/:branchId', catchAsync(updateBranch));
router.delete('/shops/:shopId/branches/:branchId', catchAsync(deleteBranch));

// POS / invoices / expenses
router.get('/shops/:shopId/pos/summary', catchAsync(posSummary));
router.route('/shops/:shopId/invoices')
  .get(catchAsync(listInvoices))
  .post(catchAsync(createPosInvoice));
router.get('/shops/:shopId/invoices/:invoiceId', catchAsync(getInvoice));
router.route('/shops/:shopId/expenses')
  .get(catchAsync(listExpenses))
  .post(catchAsync(createExpense));
router.delete('/shops/:shopId/expenses/:expenseId', catchAsync(deleteExpense));

// Services
router.route('/shops/:shopId/services')
  .post(upload.single('image'), catchAsync(addService))
  .get(catchAsync(getShopServices));

router.route('/shops/:shopId/services/:serviceId')
  .patch(upload.single('image'), catchAsync(updateService))
  .delete(catchAsync(deleteService));

// Bookings
router.route('/shops/:shopId/bookings')
  .get(catchAsync(getShopBookings));
router.patch('/bookings/:id/status', catchAsync(updateBookingStatus));

// Coupons
router.route('/shops/:shopId/coupons')
  .post(catchAsync(createCoupon))
  .get(catchAsync(getShopCoupons));

router.route('/shops/:shopId/coupons/:couponId')
  .patch(catchAsync(updateCoupon))
  .delete(catchAsync(deleteCoupon));

// Staff
router.route('/shops/:shopId/staff')
  .post(upload.single('avatar'), catchAsync(addStaff))
  .get(catchAsync(getShopStaff));

router.route('/shops/:shopId/staff/:staffId')
  .patch(upload.single('avatar'), catchAsync(updateStaff))
  .delete(catchAsync(deleteStaff));

// Analytics
router.get('/shops/:shopId/analytics', catchAsync(getShopAnalytics));

// Portfolio
router.post('/shops/:shopId/portfolio', upload.single('image'), catchAsync(addPortfolioItem));
router.delete('/portfolio/:id', catchAsync(deletePortfolioItem));

// Wallet
router.get('/wallet', catchAsync(getMyWallet));
router.post('/wallet/withdraw', catchAsync(requestWithdrawal));

export default router;
