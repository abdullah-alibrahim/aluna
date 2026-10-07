import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export interface IWithdrawalRequest extends Document {
  ownerId: IUser['_id'];
  amount: number;
  status: WithdrawalStatus;
  adminNote?: string;
  payoutDetails: string; // e.g., "Bank Acc 1234, Name: John Doe" or PayPal email
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.PENDING,
    },
    adminNote: { type: String },
    payoutDetails: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWithdrawalRequest>('WithdrawalRequest', WithdrawalRequestSchema);
