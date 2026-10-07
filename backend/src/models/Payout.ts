import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IShop } from './Shop';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface IPayout extends Document {
  ownerId: IUser['_id'];
  shopId?: IShop['_id'];
  amount: number;
  status: PayoutStatus;
  referenceId?: string; // Stripe transfer ID, Bank Ref, etc.
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.COMPLETED, // Admin manually creating it means it's usually already sent
    },
    referenceId: { type: String },
    adminNote: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayout>('Payout', PayoutSchema);
