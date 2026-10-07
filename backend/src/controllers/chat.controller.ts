import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Shop from '../models/Shop';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { getIO } from '../sockets';

export const startOrGetConversation = async (req: Request, res: Response) => {
  const shopId = req.params.shopId as string;
  const userId = req.user!.id;

  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('Shop not found');

  // If the user is the owner, they shouldn't start a conversation with themselves this way
  if (shop.ownerId.toString() === userId) {
    throw new BadRequestError('Cannot start a conversation with yourself');
  }

  // Check if conversation exists
  let conversation = await Conversation.findOne({
    shopId,
    participants: { $all: [userId, shop.ownerId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      shopId,
      participants: [userId, shop.ownerId],
    });
  }

  res.json(conversation);
};

export const getMyConversations = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', 'name avatar')
    .populate('shopId', 'name images')
    .sort({ lastMessageAt: -1 });

  res.json(conversations);
};

export const getMessages = async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user!.id;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) throw new NotFoundError('Conversation not found');

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

  res.json(messages);
};

export const sendMessage = async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const senderId = req.user!.id;
  const { text } = req.body;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId
  });

  if (!conversation) throw new NotFoundError('Conversation not found');

  const messageData: any = {
    conversationId,
    senderId,
    text,
  };

  if (req.file) {
    messageData.image = req.file.path; // Cloudinary URL
  }

  if (!messageData.text && !messageData.image) {
    throw new BadRequestError('Message must contain text or an image');
  }

  const message = await Message.create(messageData);

  // Update conversation lastMessage
  conversation.lastMessage = text || 'Sent an image';
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Find the other participant to notify them
  const recipientId = conversation.participants.find((p) => p.toString() !== senderId)?.toString();

  if (recipientId) {
    try {
      getIO().to(recipientId).emit('newMessage', message);
    } catch (error) {
      console.error('Socket.io emit error:', error);
    }
  }

  res.status(201).json(message);
};

export const markAsRead = async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user!.id;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) throw new NotFoundError('Conversation not found');

  await Message.updateMany(
    { conversationId, senderId: { $ne: userId }, read: false },
    { $set: { read: true } }
  );

  res.json({ success: true });
};
