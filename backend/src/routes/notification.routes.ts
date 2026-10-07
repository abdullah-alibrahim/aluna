import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';
import { protect } from '../middlewares/auth';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.route('/')
  .get(catchAsync(getMyNotifications));

router.route('/read-all')
  .patch(catchAsync(markAllAsRead));

router.route('/:id/read')
  .patch(catchAsync(markAsRead));

export default router;
