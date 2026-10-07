import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  name: string;
  coordinates: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

CitySchema.index({ coordinates: '2dsphere' });

export default mongoose.model<ICity>('City', CitySchema);
