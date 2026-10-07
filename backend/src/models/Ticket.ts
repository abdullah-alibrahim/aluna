import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IShop } from './Shop';
import { IBooking } from './Booking';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface ITicket extends Document {
  userId: IUser['_id'];
  shopId?: IShop['_id'];
  bookingId?: IBooking['_id'];
  subject: string;
  reason: string;
  status: TicketStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    subject: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    adminNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITicket>('Ticket', TicketSchema);
