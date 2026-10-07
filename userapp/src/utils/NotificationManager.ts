import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationManager {
  async ensureAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'إشعارات ألونا',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B59451',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'الحجوزات',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B59451',
        sound: 'default',
      });
    }
  }

  /**
   * Request permission + register Expo push token (physical device).
   * On emulator, still requests permission so local notifications work.
   */
  async registerForPushNotificationsAsync() {
    let token: string | null = null;

    try {
      await this.ensureAndroidChannel();

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

      if (!Device.isDevice) {
        console.warn('[Notifications] Emulator: local notifications enabled, remote push skipped.');
        return null;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error('[Notifications] EAS Project ID not found in app.json!');
        return null;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = tokenResponse.data;
      console.log('[Notifications] Token:', token);
    } catch (error: any) {
      console.error('[Notifications] Registration failed:', error.message);
      return null;
    }

    return token;
  }

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

  /** Local reminder — works on emulator and device */
  async scheduleLocalReminder(title: string, body: string, secondsFromNow = 3, data: any = {}) {
    await this.ensureAndroidChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsFromNow),
        channelId: 'bookings',
      },
    });
  }

  setupListeners(navigationRef: any) {
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notifications] Foreground:', notification.request.content.title);
      }
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;

        const nav = navigationRef?.current || navigationRef;
        if (!nav || (typeof nav.isReady === 'function' && !nav.isReady())) return;

        if (data?.bookingId || data?.screen === 'Bookings') {
          nav.navigate('MainTabs', { screen: 'Bookings' });
          return;
        }
        if (data?.ticketId || data?.screen === 'Messages') {
          nav.navigate('Messages');
          return;
        }
        if (data?.screen) {
          nav.navigate(data.screen, data.params);
        }
      }
    );

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }
}

export default new NotificationManager();
