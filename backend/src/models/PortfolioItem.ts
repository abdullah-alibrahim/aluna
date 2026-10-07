import mongoose, { Document, Schema } from 'mongoose';
import { IShop } from './Shop';
import { IService } from './Service';
import { IStaff } from './Staff';

export interface IPortfolioItem extends Document {
  shopId: IShop['_id'];
  imageUrl: string;
  caption?: string;
  serviceId?: IService['_id'];
  staffId?: IStaff['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioItemSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPortfolioItem>('PortfolioItem', PortfolioItemSchema);
