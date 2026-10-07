import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Shop from '../models/Shop';
import Booking, { BookingStatus } from '../models/Booking';
import { BadRequestError, NotFoundError } from '../utils/errors';

export const createReview = async (req: Request, res: Response) => {
  const shopId = req.params.shopId as string;
  const { rating, comment, bookingId } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError('Rating must be between 1 and 5');
  }

  if (!bookingId) {
    throw new BadRequestError('Booking ID is required to leave a review');
  }

  // Check if shop exists
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  // Verify the user has a COMPLETED booking at this shop for the given bookingId
  const booking = await Booking.findOne({
    _id: bookingId,
    userId: req.user!.id,
    shopId,
    status: BookingStatus.COMPLETED,
  });

  if (!booking) {
    throw new BadRequestError('You can only review a completed booking that belongs to you');
  }

  if (booking.isReviewed) {
    throw new BadRequestError('You have already reviewed this booking');
  }

  // Check if review already exists for this booking just in case
  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    throw new BadRequestError('You have already reviewed this booking');
  }

  // Handle optional photo uploads via multer + cloudinary
  const photos: string[] = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      photos.push(file.path);
    }
  }

  // Create Review
  const review = await Review.create({
    userId: req.user!.id,
    shopId,
    bookingId,
    rating,
    comment,
    photos,
  });

  // Mark booking as reviewed
  booking.isReviewed = true;
  await booking.save();

  // Calculate new average rating and update Shop
  const stats = await Review.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
    {
      $group: {
        _id: '$shopId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Shop.findByIdAndUpdate(shopId, {
      rating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: stats[0].reviewCount,
    });
  }

  res.status(201).json(review);
};

export const getShopReviews = async (req: Request, res: Response) => {
  const shopId = req.params.shopId as string;

  const reviews = await Review.find({ shopId })
    .populate('userId', 'name avatar') // Assuming user has name and avatar
    .sort({ createdAt: -1 });

  res.json(reviews);
};
