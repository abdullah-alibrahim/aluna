import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../config/firebase';

// In-memory token fallback for when AsyncStorage native module is missing
let inMemoryToken = null;

export const setAuthToken = (token) => {
  inMemoryToken = token;
};

// Safe Storage Wrapper to prevent [Native module is null] crashes
const getStorageItem = async (key) => {
  try {
    if (key === 'token') {
      const value = await SecureStore.getItemAsync(key);
      if (value) return value;
    } else {
      const value = await AsyncStorage.getItem(key);
      if (value) return value;
    }
    return inMemoryToken; // Fallback to memory if storage is empty
  } catch (error) {
    return inMemoryToken; // Fallback to memory if storage fails
  }
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Refresh Firebase ID token on every request (fixes sudden admin logouts)
apiClient.interceptors.request.use(
  async (config) => {
    let token = await getStorageItem('token');

    if (auth?.currentUser) {
      try {
        const firebaseToken = await auth.currentUser.getIdToken();
        if (firebaseToken) {
          token = firebaseToken;
          await SecureStore.setItemAsync('token', firebaseToken).catch(() => {});
          setAuthToken(firebaseToken);
        }
      } catch (e) {
        console.warn('Could not refresh Firebase token', e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;
