import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IWallet extends Document {
  ownerId: IUser['_id'];
  balance: number; // Current available balance to withdraw
  totalEarnings: number; // All-time total earnings
  totalWithdrawn: number; // All-time total withdrawn
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWallet>('Wallet', WalletSchema);
