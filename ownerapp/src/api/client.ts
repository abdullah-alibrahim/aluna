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

// Replace with your machine's local IP for Android emulator/iOS physical device
// Or use your production backend URL
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Interceptor to attach JWT token and log requests
apiClient.interceptors.request.use(
  async (config) => {
    let token = await getStorageItem('token');

    // Attempt to get fresh token from Firebase
    if (auth?.currentUser) {
      try {
        const firebaseToken = await auth.currentUser.getIdToken();
        if (firebaseToken) {
          token = firebaseToken;
        }
      } catch (e) {
        console.warn('Could not refresh Firebase token', e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    // console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // console.log(`[API Response] ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    if (!error.response) {
      // console.error(`[Network/Storage Error] ${error.config?.url}: ${error.message}`);
    } else if (error.response.status !== 401) {
      // Only log errors that are NOT 401 (Unauthorized) to reduce console noise
      // console.error(`[API Response Error] ${error.config?.url}: ${error.status} - ${error.message}`);
    } else {
      // Log 401 more subtly
      // console.log(`[Auth Info] ${error.config?.url}: 401 Unauthorized (Expected for public or expired tokens)`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
