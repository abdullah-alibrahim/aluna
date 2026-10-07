import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from '../api/client';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Keep for older iOS versions just in case
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationManager {
  /**
   * Register for push notifications and return the Expo Push Token
   */
  async registerForPushNotificationsAsync() {
    let token;

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.warn('[Notifications] Physical device required for push notifications.');
      return null;
    }

    try {
      // Step 1: Check & Request Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permission denied!');
        return null;
      }

      // Step 2: Setup Android Notification Channel (BEFORE getting token)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#B59451', // SalonApp primary color
          sound: 'default',
        });
      }

      // Step 3: Resolve EAS Project ID
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error('[Notifications] EAS Project ID not found in app.json!');
        return null;
      }

      // Step 4: Get the Expo Push Token
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = tokenResponse.data;

      console.log('[Notifications] Token:', token);
    } catch (error: any) {
      console.error('[Notifications] Registration failed:', error.message);
      return null;
    }

    return token;
  }

  /**
   * Send the token to your backend for storage
   */
  async syncTokenWithBackend(token: string) {
    if (!token) return false;

    try {
      await apiClient.put('/auth/push-token', { pushToken: token });
      console.log('[Notifications] Token synced to backend.');
      return true;
    } catch (error: any) {
      console.error('[Notifications] Sync failed:', error.message);
      return false;
    }
  }

  /**
   * Setup listeners for foreground and tap events
   */
  setupListeners(navigationRef: any) {
    // Foreground: notification received while app is open
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notifications] Foreground notification received:', notification.request.content.title);
      }
    );

    // Tap: user tapped the notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;

        // Deep-link to the correct screen
        if (data?.screen) {
          const nav = navigationRef?.current || navigationRef;
          if (nav && (typeof nav.isReady !== 'function' || nav.isReady())) {
            nav.navigate(data.screen, data.params);
          }
        }
      }
    );

    // Return cleanup function
    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }
}

export default new NotificationManager();
