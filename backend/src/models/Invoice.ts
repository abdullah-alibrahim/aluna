import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { IUser } from './User';
import { IBranch } from './Branch';

export interface IInvoiceItem {
  type: 'service' | 'product' | 'custom';
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
}

export interface IInvoice extends Document {
  shopId: IShop['_id'];
  ownerId: IUser['_id'];
  branchId?: IBranch['_id'];
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  userId?: IUser['_id'];
  items: IInvoiceItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  bookingIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String },
    customerPhone: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [
      {
        type: { type: String, enum: ['service', 'product', 'custom'], required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
        serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
        staffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'card'], default: 'cash' },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'paid' },
    notes: { type: String },
    bookingIds: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
