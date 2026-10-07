import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IShop } from './Shop';
import { IService } from './Service';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface IBooking extends Document {
  userId: IUser['_id'];
  shopId: IShop['_id'];
  branchId?: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  serviceIds: IService['_id'][];
  /** Shared id when multiple people book together */
  groupId?: string;
  partySize: number;
  guestName?: string;
  date: Date;
  startTime: string; // e.g. "14:00"
  endTime: string; // e.g. "15:00"
  status: BookingStatus;
  isLocked: boolean;
  lockedUntil?: Date;
  isReviewed: boolean;
  paymentStatus: 'pending' | 'paid';
  paymentMethod: 'cash' | 'stripe' | 'card';
  paymentId?: mongoose.Types.ObjectId;
  totalPrice: number;
  originalPrice: number;
  discountAmount: number;
  couponId?: mongoose.Types.ObjectId;
  pointsRedeemed: number;
  pointsEarned: number;
  /** Deposit amount expected / paid toward booking */
  depositAmount: number;
  depositPaid: boolean;
  /** Fee applied on late cancel or no-show */
  feeCharged: number;
  feeType: 'none' | 'cancellation' | 'no_show';
  createdAt: Date;
  updatedAt: Date;
  wasNew?: boolean;
}

const BookingSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
    groupId: { type: String, index: true },
    partySize: { type: Number, default: 1, min: 1 },
    guestName: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    isLocked: { type: Boolean, default: false },
    lockedUntil: { type: Date },
    isReviewed: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'stripe', 'card'],
      default: 'cash',
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    totalPrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    pointsRedeemed: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    depositPaid: { type: Boolean, default: false },
    feeCharged: { type: Number, default: 0, min: 0 },
    feeType: {
      type: String,
      enum: ['none', 'cancellation', 'no_show'],
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ shopId: 1, date: 1, status: 1 });

// Let's implement the pre/post save logic properly.
BookingSchema.pre('save', function (this: any) {
  this.wasNew = this.isNew;
});

BookingSchema.post('save', async function (doc: any) {
  if (doc.wasNew) {
    try {
      const { sendNotification } = require('../services/notification.service');
      const { NotificationType } = require('./Notification');
      
      // Dynamic imports to avoid circular dependencies
      const Shop = mongoose.model('Shop');
      const User = mongoose.model('User');
      
      const shop = await Shop.findById(doc.shopId);
      const user = await User.findById(doc.userId);
      
      if (shop && user) {
        await sendNotification({
          recipientId: shop.ownerId.toString(),
          title: 'New Booking Received! 🎉',
          message: `${user.name} has booked an appointment on ${new Date(doc.date).toLocaleDateString()} at ${doc.startTime}.`,
          type: NotificationType.BOOKING_CREATED,
          data: { bookingId: doc._id, shopId: doc.shopId },
        });
      }
    } catch (error) {
      console.error('Error sending booking push notification:', error);
    }
  }
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
