import express from 'express';
import { createReview, getShopReviews } from '../controllers/review.controller';
import { protect } from '../middlewares/auth';
import { catchAsync } from '../utils/catchAsync';
import { upload } from '../middlewares/upload';

const router = express.Router();

router.route('/:shopId')
  .get(catchAsync(getShopReviews))
  .post(protect, upload.array('photos', 5), catchAsync(createReview));

export default router;
