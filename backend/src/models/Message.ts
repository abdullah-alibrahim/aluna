import mongoose, { Document, Schema } from 'mongoose';
import { IConversation } from './Conversation';
import { IUser } from './User';

export interface IMessage extends Document {
  conversationId: IConversation['_id'];
  senderId: IUser['_id'];
  text?: string;
  image?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    image: { type: String },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
