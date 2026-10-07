import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { ICity } from './City';

export interface IBranch extends Document {
  shopId: IShop['_id'];
  name: string;
  address: string;
  cityId: ICity['_id'];
  phone?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  operatingHours?: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  isMain: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    phone: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    operatingHours: [
      {
        day: { type: String, required: true },
        open: { type: String },
        close: { type: String },
        isClosed: { type: Boolean, default: false },
      },
    ],
    isMain: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BranchSchema.index({ location: '2dsphere' });
BranchSchema.index({ shopId: 1, isActive: 1 });

export default mongoose.model<IBranch>('Branch', BranchSchema);
