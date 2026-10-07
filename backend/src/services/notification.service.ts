import Notification, { NotificationType } from '../models/Notification';
import { getIO } from '../sockets';
import { Expo } from 'expo-server-sdk';
import User from '../models/User';

const expo = new Expo();

interface SendNotificationParams {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
}

export const sendNotification = async ({
  recipientId,
  title,
  message,
  type,
  data,
}: SendNotificationParams) => {
  try {
    // 1. Save to Database
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      type,
      data,
    });

    // 2. Emit via Socket.io if the user is online
    const io = getIO();
    io.to(recipientId).emit('notification', notification);

    // 3. Send Expo Push Notification
    const user = await User.findById(recipientId);
    if (user && user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
      const messages = [{
        to: user.pushToken,
        sound: 'default',
        title: title,
        body: message,
        data: data,
      }];
      
      try {
        const chunks = expo.chunkPushNotifications(messages as any);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      } catch (pushError) {
        console.error('Failed to send Expo push notification:', pushError);
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Don't throw the error, we don't want a notification failure to break the main transaction
  }
};
