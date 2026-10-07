import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYOUT_UPDATED = 'PAYOUT_UPDATED',
  SYSTEM = 'SYSTEM',
}

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    read: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
