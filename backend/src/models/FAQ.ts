import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  target: 'user' | 'owner';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>({
  question: {
    type: String,
    required: [true, 'Please provide a question'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'Please provide an answer'],
  },
  target: {
    type: String,
    enum: ['user', 'owner'],
    required: [true, 'Please specify if this FAQ is for users or owners'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IFAQ>('FAQ', faqSchema);
