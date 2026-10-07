import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IShop } from './Shop';

export interface IReview extends Document {
  userId: IUser['_id'];
  shopId: IShop['_id'];
  bookingId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    photos: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only leave one review per booking
ReviewSchema.index({ bookingId: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
