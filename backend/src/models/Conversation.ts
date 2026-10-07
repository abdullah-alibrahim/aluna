import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IShop } from './Shop';

export interface IConversation extends Document {
  participants: IUser['_id'][];
  shopId: IShop['_id'];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
