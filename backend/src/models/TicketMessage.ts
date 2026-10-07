import mongoose, { Document, Schema } from 'mongoose';
import { ITicket } from './Ticket';
import { IUser } from './User';

export interface ITicketMessage extends Document {
  ticketId: ITicket['_id'];
  senderId: IUser['_id'];
  isAdmin: boolean;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema: Schema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAdmin: { type: Boolean, default: false },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITicketMessage>('TicketMessage', TicketMessageSchema);
