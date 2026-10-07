import { Expo } from 'expo-server-sdk';

let expo = new Expo();

/**
 * Send a push notification to a specific user
 * @param pushToken - Expo push token
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Payload for deep linking
 */
export const sendPushNotification = async (pushToken: string, title: string, body: string, data: any = {}) => {
  // Validate token format
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`[PushService] Invalid push token: ${pushToken}`);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default' as const,
    title,
    body,
    data,
    priority: 'high' as const,
    channelId: 'default', // Must match Android channel ID
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('[PushService] Ticket:', ticket);
    return ticket;
  } catch (error) {
    console.error('[PushService] Error sending notification:', error);
  }
};
