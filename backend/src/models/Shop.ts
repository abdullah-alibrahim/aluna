import mongoose, { Document, Schema } from 'mongoose';
import { ICity } from './City';
import { IUser } from './User';

export interface IShop extends Document {
  ownerId: IUser['_id'];
  name: string;
  description?: string;
  address: string;
  cityId: ICity['_id'];
  categoryIds: mongoose.Types.ObjectId[];
  location: {
    type: string;
    coordinates: number[];
  };
  images: string[];
  isApproved: boolean;
  /** pending | approved | rejected — keeps isApproved in sync for listings */
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  operatingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  rating: number;
  reviewCount: number;
  slotInterval: number; // e.g. 15, 30, 60 mins
  /** Require deposit (cash policy or online partial pay) */
  requiresDeposit: boolean;
  /** Override platform deposit %; null/undefined = use platform default */
  depositPercent?: number;
  /** Override platform no-show fee % */
  noShowFeePercent?: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    address: { type: String, required: true },
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    images: [{ type: String }],
    isApproved: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    operatingHours: [
      {
        day: { type: String, required: true },
        open: { type: String },
        close: { type: String },
        isClosed: { type: Boolean, default: false },
      },
    ],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    slotInterval: { type: Number, default: 15 },
    requiresDeposit: { type: Boolean, default: false },
    depositPercent: { type: Number, min: 0, max: 100 },
    noShowFeePercent: { type: Number, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

ShopSchema.index({ location: '2dsphere' });

export default mongoose.model<IShop>('Shop', ShopSchema);
