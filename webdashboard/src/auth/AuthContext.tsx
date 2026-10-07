import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User as FbUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      setError(null);
      if (!user) {
        setMe(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await api<Me>('/auth/me');
        if (profile.role !== 'admin' && profile.role !== 'owner') {
          await signOut(auth);
          setMe(null);
          setError('هذه اللوحة للأدمن أو المالك فقط');
        } else {
          setMe(profile);
        }
      } catch (e: any) {
        setError(e.message || 'فشل جلب الملف');
        setMe(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setLoading(false);
      setError('فشل تسجيل الدخول. تحققي من البريد وكلمة المرور.');
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
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
