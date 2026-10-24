import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'https://aluna-api-flax.vercel.app/api';
const PASSWORD_TOKEN_KEY = 'aluna_password_token';

export function getPasswordToken() {
  return localStorage.getItem(PASSWORD_TOKEN_KEY);
}

export function setPasswordToken(token: string | null) {
  if (!token) localStorage.removeItem(PASSWORD_TOKEN_KEY);
  else localStorage.setItem(PASSWORD_TOKEN_KEY, token);
}

async function token() {
  const passwordToken = getPasswordToken();
  if (passwordToken) return passwordToken;
  const user = auth.currentUser;
  if (!user) throw new Error('غير مسجّل الدخول');
  return user.getIdToken();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const WD_CACHE_PREFIXES = ['/users/shops', '/users/categories', '/users/banners', '/auth/cities', '/auth/categories', '/auth/settings', '/faqs', '/owner', '/admin'];
const WD_CACHE_TTL = 15_000;
const wdCache = new Map<string, { data: any; expiry: number; promise?: Promise<any> }>();

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') wdCache.clear();
  const cacheable = method === 'GET' && WD_CACHE_PREFIXES.some((p) => path.startsWith(p));

  const key = method + '|' + path;
  if (cacheable) {
    const now = Date.now();
    const hit = wdCache.get(key);
    if (hit && now < hit.expiry) {
      if (hit.promise) return hit.promise as Promise<T>;
      return hit.data as T;
    }
  }

  const run = async () => {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    try {
      const t = await token();
      headers.set('Authorization', `Bearer ${t}`);
    } catch {
      /* public */
    }
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.message || data.error || 'فشل الطلب', res.status);
    return data as T;
  };

  if (!cacheable) return run();

  const promise = run()
    .then((data) => {
      wdCache.set(key, { data, expiry: Date.now() + WD_CACHE_TTL });
      return data;
    })
    .catch((err) => {
      wdCache.delete(key);
      throw err;
    });
  wdCache.set(key, { data: null, expiry: Date.now() + WD_CACHE_TTL, promise });
  return promise as Promise<T>;
}

/** Multipart upload (images) — do not set Content-Type manually */
export async function apiForm<T = any>(path: string, form: FormData, method = 'POST'): Promise<T> {
  return api<T>(path, { method, body: form });
}

export const money = (n: number | undefined) =>
  `${Number(n || 0).toLocaleString('ar-SY')} ل.س`;
