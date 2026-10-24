import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAZ1_CZ92ekQjPEb_fmDhJHntjpqoMCenI',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'aluna-23119.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'aluna-23119',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'aluna-23119.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '944769790448',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:944769790448:web:e2a2b78a6238334d3e6d35',
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase app init failed', e);
  app = getApps()[0];
}

let auth: ReturnType<typeof getAuth> | null = null;

try {
  if (app) {
    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      try {
        // RN-only persistence — not available on web
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getReactNativePersistence } = require('firebase/auth');
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (e: any) {
        if (e?.code === 'auth/already-initialized') {
          auth = getAuth(app);
        } else {
          console.warn('Firebase auth init failed, falling back', e);
          auth = getAuth(app);
        }
      }
    }
  }
} catch (e) {
  console.warn('Firebase auth unavailable', e);
  auth = null;
}

export { auth };
export default app;
