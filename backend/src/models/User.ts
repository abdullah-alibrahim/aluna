import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { ICoupon } from './Coupon';

export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  USER = 'user',
}

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  firebaseUid?: string;
  isVerified: boolean;
  role: UserRole;
  phone?: string;
  gender?: string;
  profilePicture?: string;
  favoriteShops: IShop['_id'][];
  collectedCoupons: {
    couponId: ICoupon['_id'];
    isUsed: boolean;
    collectedAt: Date;
    usedAt?: Date;
  }[];
  loyaltyPoints: number;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // optional for OAuth users later, but needed for local
    firebaseUid: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    profilePicture: { type: String },
    favoriteShops: [{ type: Schema.Types.ObjectId, ref: 'Shop' }],
    collectedCoupons: [
      {
        couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
        isUsed: { type: Boolean, default: false },
        collectedAt: { type: Date, default: Date.now },
        usedAt: { type: Date },
      }
    ],
    loyaltyPoints: { type: Number, default: 0 },
    pushToken: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
