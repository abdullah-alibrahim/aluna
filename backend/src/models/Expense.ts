import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { IUser } from './User';
import { IBranch } from './Branch';

export interface IExpense extends Document {
  shopId: IShop['_id'];
  ownerId: IUser['_id'];
  branchId?: IBranch['_id'];
  category: string;
  amount: number;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
