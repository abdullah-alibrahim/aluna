import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'https://aluna-api-flax.vercel.app/api';
const PASSWORD_TOKEN_KEY = 'aluna_password_token';

export function getPasswordToken() {
  return localStorage.getItem(PASSWORD_TOKEN_KEY);
}

/** Cache scope changes whenever the logged-in identity changes. */
let cacheScope = getPasswordToken() || 'anon';

type CacheRule = { prefix: string; ttl: number; swr?: boolean };

/**
 * Cache rules ordered by specificity (first match wins).
 * - Catalog data is safe to keep longer and can be refreshed in the background.
 * - Owner/admin data is short-lived and always revalidated so dashboards stay truthful.
 */
const CACHE_RULES: CacheRule[] = [
  { prefix: '/auth/cities', ttl: 5 * 60_000, swr: true },
  { prefix: '/auth/categories', ttl: 5 * 60_000, swr: true },
  { prefix: '/auth/settings', ttl: 5 * 60_000, swr: true },
  { prefix: '/users/categories', ttl: 5 * 60_000, swr: true },
  { prefix: '/users/banners', ttl: 2 * 60_000, swr: true },
  { prefix: '/faqs', ttl: 5 * 60_000, swr: true },
  { prefix: '/users/shops', ttl: 30_000, swr: true },
  { prefix: '/owner', ttl: 15_000 },
  { prefix: '/admin', ttl: 15_000 },
];

const wdCache = new Map<string, { data: any; expiry: number; promise?: Promise<any> }>();

/** Drop every cached response (called on login/logout and after mutations). */
export function clearApiCache() {
  wdCache.clear();
}

export function setPasswordToken(token: string | null) {
  if (!token) localStorage.removeItem(PASSWORD_TOKEN_KEY);
  else localStorage.setItem(PASSWORD_TOKEN_KEY, token);
  // Never reuse another account's cached dashboard data
  cacheScope = token || 'anon';
  wdCache.clear();
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
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function ruleFor(path: string) {
  return CACHE_RULES.find((r) => path.startsWith(r.prefix));
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') wdCache.clear();

  const rule = method === 'GET' ? ruleFor(path) : undefined;
  if (!rule) return request<T>(path, options);

  const key = `${cacheScope}|${path}`;
  const now = Date.now();
  const hit = wdCache.get(key);

  if (hit) {
    if (hit.promise) return hit.promise as Promise<T>;
    if (now < hit.expiry) return hit.data as T;
    // Stale-while-revalidate: serve instantly, refresh in the background
    if (rule.swr && hit.data !== undefined) {
      void fetchAndStore<T>(key, path, options, rule.ttl);
      return hit.data as T;
    }
  }

  return fetchAndStore<T>(key, path, options, rule.ttl);
}

function fetchAndStore<T>(key: string, path: string, options: RequestInit, ttl: number): Promise<T> {
  const promise = request<T>(path, options)
    .then((data) => {
      wdCache.set(key, { data, expiry: Date.now() + ttl });
      return data;
    })
    .catch((err) => {
      wdCache.delete(key);
      throw err;
    });
  wdCache.set(key, { data: undefined, expiry: Date.now() + ttl, promise });
  return promise;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  try {
    const t = await token();
    headers.set('Authorization', `Bearer ${t}`);
  } catch {
    /* public endpoint */
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || data.error || 'فشل الطلب', res.status, data.code);
  }
  return data as T;
}

/** Multipart upload (images) — do not set Content-Type manually */
export async function apiForm<T = any>(path: string, form: FormData, method = 'POST'): Promise<T> {
  return api<T>(path, { method, body: form });
}

export const money = (n: number | undefined) =>
  `${Number(n || 0).toLocaleString('ar-SY')} ل.س`;
