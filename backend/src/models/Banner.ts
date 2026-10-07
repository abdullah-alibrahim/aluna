import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  targetLink?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    imageUrl: { type: String, required: true },
    targetLink: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBanner>('Banner', BannerSchema);
