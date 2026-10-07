import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  platformCommissionRate: number; // e.g., 10 for 10%
  stripePublicKey: string;
  stripeSecretKey: string;
  currency: string;
  currencyCode: string; // e.g. 'usd'
  /** Default deposit % of booking total when shop requires deposit */
  depositPercent: number;
  /** Default no-show fee % of booking total */
  noShowFeePercent: number;
  /** Free cancellation window before appointment start */
  freeCancelHours: number;
  isGlobal: boolean; // Only one document should exist where isGlobal = true
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema: Schema = new Schema(
  {
    platformCommissionRate: { type: Number, default: 10, min: 0, max: 100 },
    stripePublicKey: { type: String, default: '' },
    stripeSecretKey: { type: String, default: '' },
    currency: { type: String, default: 'ل.س' },
    currencyCode: { type: String, default: 'syp' },
    depositPercent: { type: Number, default: 20, min: 0, max: 100 },
    noShowFeePercent: { type: Number, default: 50, min: 0, max: 100 },
    freeCancelHours: { type: Number, default: 4, min: 0 },
    isGlobal: { type: Boolean, default: true, unique: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
