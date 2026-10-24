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

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://aluna-api-flax.vercel.app/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout (Vercel serverless cold starts can be slow)
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

// Lightweight in-memory GET cache for high-traffic read-mostly endpoints.
const CLIENT_CACHE_PREFIXES = ['/users/shops', '/users/categories', '/users/banners', '/auth/cities', '/auth/categories', '/auth/settings', '/faqs', '/admin/shops', '/admin/categories', '/admin/cities'];
const CLIENT_CACHE_TTL = 15_000;
const clientCache = new Map<string, { data: any; expiry: number; promise?: Promise<any> }>();

function isCacheableUrl(url: string | undefined | null) {
  if (!url) return false;
  return CLIENT_CACHE_PREFIXES.some((p) => String(url).startsWith(p));
}

// Enhanced in-memory GET wrapper with offline-first AsyncStorage fallback
const OFFLINE_TTL = 24 * 60 * 60 * 1000;
async function persistOfflineCache(key: string, data: any) {
  try { await AsyncStorage.setItem('offline_cache_' + key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}
async function loadOfflineCache(key: string) {
  try {
    const raw = await AsyncStorage.getItem('offline_cache_' + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed?.ts || 0) > OFFLINE_TTL) return null;
    return parsed.data;
  } catch { return null; }
}

const __originalGet = apiClient.get.bind(apiClient);
(apiClient as any).get = (url: any, config?: any) => {
  if (!isCacheableUrl(String(url || ''))) return __originalGet(url, config);
  const key = String(url) + '|' + JSON.stringify(config?.params || {});
  const now = Date.now();
  const hit = clientCache.get(key);
  if (hit && now < hit.expiry) {
    if (hit.promise) return hit.promise;
    return Promise.resolve(hit.data);
  }
  const promise = __originalGet(url, config)
    .then(async (res: any) => {
      clientCache.set(key, { data: res, expiry: Date.now() + CLIENT_CACHE_TTL });
      persistOfflineCache(key, res?.data);
      return res;
    })
    .catch(async (err: any) => {
      clientCache.delete(key);
      if (!err?.response) {
        const stale = await loadOfflineCache(key);
        if (stale) {
          return { data: stale, status: 200, statusText: 'OK (offline cache)', config: err.config, headers: {} } as any;
        }
      }
      throw err;
    });
  clientCache.set(key, { data: null, expiry: now + CLIENT_CACHE_TTL, promise });
  return promise;
};

// Clear client cache after any mutating request to avoid stale reads.
for (const __m of ['post', 'put', 'patch', 'delete']) {
  const __orig = (apiClient as any)[__m]?.bind(apiClient);
  if (__orig) {
    (apiClient as any)[__m] = (...args: any[]) => {
      clientCache.clear();
      return __orig(...args);
    };
  }
}
