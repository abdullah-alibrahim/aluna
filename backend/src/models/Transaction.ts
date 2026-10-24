import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IShop } from './Shop';
import { IBooking } from './Booking';

export enum TransactionType {
  EARNING = 'earning', // from completed booking
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
}

export interface ITransaction extends Document {
  ownerId: IUser['_id'];
  shopId?: IShop['_id'];
  bookingId?: IBooking['_id'];
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ ownerId: 1, createdAt: -1 });
TransactionSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
