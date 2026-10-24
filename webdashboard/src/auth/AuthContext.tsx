import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User as FbUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api, getPasswordToken, setPasswordToken, ApiError } from '../lib/api';

type Me = { _id: string; name: string; email: string; role: 'admin' | 'owner' | 'user' };

type Ctx = {
  fbUser: FbUser | null;
  me: Me | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);
const API_URL = import.meta.env.VITE_API_URL || 'https://aluna-api-flax.vercel.app/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acceptProfile = async (profile: Me) => {
    if (profile.role !== 'admin' && profile.role !== 'owner') {
      setPasswordToken(null);
      await signOut(auth).catch(() => undefined);
      setMe(null);
      setError('هذه اللوحة للإدارة أو المالك فقط');
      return false;
    }
    setMe(profile);
    return true;
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      if (getPasswordToken()) {
        let lastErr: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const profile = await api<Me>('/auth/me');
            if (!cancelled) await acceptProfile(profile);
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
            const status = e instanceof ApiError ? e.status : 0;
            if (status === 401 || status === 403) break; // no point retrying
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            if (cancelled) break;
          }
        }
        if (lastErr) {
          const status = lastErr instanceof ApiError ? lastErr.status : 0;
          if (status === 401 || status === 403) {
            setPasswordToken(null);
            if (!cancelled) {
              setError(lastErr.message || 'انتهت الجلسة');
              setMe(null);
            }
          } else if (!cancelled) {
            setError(lastErr.message || 'تعذر الاتصال بالخادم');
          }
        }
        if (!cancelled) setLoading(false);
        return;
      }

      unsub = onAuthStateChanged(auth, async (user) => {
        setFbUser(user);
        setError(null);
        if (!user) {
          setMe(null);
          setLoading(false);
          return;
        }
        try {
          const profile = await api<Me>('/auth/me');
          await acceptProfile(profile);
        } catch (e: any) {
          setError(e.message || 'فشل جلب الملف');
          setMe(null);
        } finally {
          setLoading(false);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/password-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setPasswordToken(data.token);
        const ok = await acceptProfile({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
        if (!ok) throw new Error('unauthorized role');
        setLoading(false);
        return;
      }

      setPasswordToken(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setLoading(false);
      setError('فشل تسجيل الدخول. تحققي من البريد وكلمة المرور.');
      throw e;
    }
  };

  const logout = async () => {
    setPasswordToken(null);
    await signOut(auth).catch(() => undefined);
    setMe(null);
  };

  return (
    <AuthContext.Provider value={{ fbUser, me, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
