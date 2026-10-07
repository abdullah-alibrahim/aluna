import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getMyNotifications = async (req: Request, res: Response) => {
  const notifications = await Notification.find({ recipientId: req.user!.id })
    .sort({ createdAt: -1 })
    .limit(50); // Get last 50 notifications

  res.json(notifications);
};

export const markAsRead = async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id as any, recipientId: req.user!.id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }

  res.json(notification);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  await Notification.updateMany(
    { recipientId: req.user!.id, read: false },
    { read: true }
  );

  res.json({ message: 'All notifications marked as read' });
};
