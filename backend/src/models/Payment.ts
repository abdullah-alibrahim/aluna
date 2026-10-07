import mongoose, { Document, Schema } from 'mongoose';
import { IBooking } from './Booking';
import { IUser } from './User';
import { IShop } from './Shop';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  FULL = 'full',
  DEPOSIT = 'deposit',
  CASH = 'cash_at_salon',
}

export interface IPayment extends Document {
  bookingId: IBooking['_id'];
  userId: IUser['_id'];
  shopId: IShop['_id'];
  ownerId: IUser['_id'];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amountTotal: number;
  platformFee: number;
  ownerEarnings: number;
  status: PaymentStatus;
  type: PaymentType;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    amountTotal: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    ownerEarnings: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    type: {
      type: String,
      enum: Object.values(PaymentType),
      default: PaymentType.FULL,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
