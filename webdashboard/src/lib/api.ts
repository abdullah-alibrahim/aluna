import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

async function token() {
  const user = auth.currentUser;
  if (!user) throw new Error('غير مسجّل الدخول');
  return user.getIdToken();
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  try {
    const t = await token();
    headers.set('Authorization', `Bearer ${t}`);
  } catch {
    /* public */
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'فشل الطلب');
  return data as T;
}

export const money = (n: number | undefined) =>
  `${Number(n || 0).toLocaleString('ar-SY')} ل.س`;
