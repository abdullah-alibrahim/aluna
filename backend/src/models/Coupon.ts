import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';

export interface ICoupon extends Document {
  code: string;
  discountPercentage: number;
  maxDiscount?: number;
  expiryDate: Date;
  shopId: IShop['_id'];
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    discountPercentage: { type: Number, required: true, min: 1, max: 100 },
    maxDiscount: { type: Number, min: 0 },
    expiryDate: { type: Date, required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Ensure codes are unique per shop
CouponSchema.index({ code: 1, shopId: 1 }, { unique: true });

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
