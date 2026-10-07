import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { IService } from './Service';

export interface IStaff extends Document {
  shopId: IShop['_id'];
  /** Optional: staff assigned to a specific branch */
  branchId?: mongoose.Types.ObjectId;
  name: string;
  role: string;
  avatar?: string;
  servicesProvided: IService['_id'][];
  workingHours: {
    day: string; // "Monday", "Tuesday", etc.
    open: string; // "09:00"
    close: string; // "17:00"
    isClosed: boolean;
    breaks: {
      start: string; // "12:00"
      end: string; // "13:00"
    }[];
  }[];
  blockedDates: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String },
    servicesProvided: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    workingHours: [
      {
        day: { type: String, required: true },
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false },
        breaks: [
          {
            start: { type: String, required: true },
            end: { type: String, required: true },
          },
        ],
      },
    ],
    blockedDates: [{ type: Date }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IStaff>('Staff', StaffSchema);
