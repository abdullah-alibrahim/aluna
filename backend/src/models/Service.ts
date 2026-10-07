import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { ICategory } from './Category';

export interface IService extends Document {
  shopId: IShop['_id'];
  categoryId: ICategory['_id'];
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  bufferTime: number; // in minutes for cleanup/prep
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 }, // minutes
    bufferTime: { type: Number, default: 0, min: 0 }, // cleanup time
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IService>('Service', ServiceSchema);
