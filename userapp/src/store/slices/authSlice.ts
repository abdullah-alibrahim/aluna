import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import apiClient, { setAuthToken } from '../../api/client';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword as firebaseUpdatePassword, signOut } from 'firebase/auth';

// Helper for safe storage operations
const safeSetItem = async (key, value) => {
  try {
    if (key === 'token') {
      await SecureStore.setItemAsync(key, value);
      setAuthToken(value); // Always sync to memory
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (err: any) {
    if (key === 'token') setAuthToken(value); // Sync to memory even if storage fails
    console.warn(`[Storage Error] Could not save ${key}:`, err.message);
  }
};

const clearAuthToken = async () => {
  setAuthToken(null);
  try {
    await SecureStore.deleteItemAsync('token');
  } catch (err: any) {
    console.warn('Could not delete SecureStore token:', err?.message);
  }
  try {
    await AsyncStorage.removeItem('token');
  } catch (err: any) {
    console.warn('Could not delete AsyncStorage token:', err?.message);
  }
};

/** Normalize Syrian/local phone → Firebase email identity (no OTP). */
export const phoneToAuthEmail = (phone: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return `${digits}@phone.aluna.app`;
};

export const normalizePhone = (phone: string) => {
  let digits = String(phone || '').replace(/\D/g, '');
  // Syria: 09xxxxxxxx → 9639xxxxxxxx ; 9xxxxxxxx → 9639xxxxxxxx
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = `963${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('9')) digits = `963${digits}`;
  return digits;
};

// AsyncThunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    let firebaseUser: any = null;
    try {
      const phone = normalizePhone(userData.phone);
      if (!phone || phone.length < 9) {
        return rejectWithValue('أدخل رقم هاتف صحيح');
      }
      const email = phoneToAuthEmail(phone);

      // 1. Create user in Firebase (phone → synthetic email, no OTP / WhatsApp)
      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      firebaseUser = userCredential.user;

      // 2. Get Firebase Token (skip email verification — phone login)
      const firebaseToken = await userCredential.user.getIdToken();

      // 3. Backend profile
      const payload = {
        name: userData.name,
        role: userData.role || 'user',
        phone,
        gender: userData.gender,
        token: firebaseToken,
      };

      const response = await apiClient.post('/auth/register', payload);

      if (response.data.role !== 'user') {
        await firebaseUser.delete().catch(() => {});
        return rejectWithValue('غير مصرح: للعملاء فقط');
      }
      
      await safeSetItem('token', response.data.token);
      return { ...response.data, isVerified: true, phone };
    } catch (err: any) {
      console.log('Register Error:', err.message);
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (deleteErr) {
          console.warn('Failed to delete orphan Firebase user:', deleteErr);
        }
      }
      if (err.response) {
        return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'فشل التسجيل');
      }
      return rejectWithValue(err.message || 'فشل التسجيل');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const phone = normalizePhone(credentials.phone || credentials.email);
      const email = phone.includes('@')
        ? credentials.email
        : phoneToAuthEmail(phone);

      if (!email || !credentials.password) {
        return rejectWithValue('أدخل رقم الهاتف وكلمة المرور');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
      const firebaseToken = await userCredential.user.getIdToken();
      const response = await apiClient.post('/auth/login', { token: firebaseToken });
      
      if (response.data.role !== 'user') {
        return rejectWithValue('غير مصرح: للعملاء فقط');
      }
      if (response.data.status === 'blocked' || response.data.isBlocked) {
        return rejectWithValue('تم حظر حسابك. يرجى التواصل مع الدعم.');
      }

      await safeSetItem('token', response.data.token);
      // Phone accounts are treated as verified (no email OTP)
      const isPhoneAccount = email.endsWith('@phone.aluna.app');
      return {
        ...response.data,
        isVerified: isPhoneAccount ? true : response.data.isVerified,
      };
    } catch (err: any) {
      console.log('Login Error:', err.message);
      if (err.response) {
        return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'فشل تسجيل الدخول');
      }
      return rejectWithValue(err.message || 'فشل تسجيل الدخول');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: any, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: 'تم إرسال رسالة استعادة كلمة المرور' };
    } catch (err: any) {
      console.log('Forgot Password Error:', err.message);
      return rejectWithValue(err.message || 'فشل إرسال رسالة الاستعادة');
    }
  }
);
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      const data = response.data;
      const backendVerified = !!(data?.data?.isVerified ?? data?.isVerified);

      if (auth.currentUser?.emailVerified) {
        if (!backendVerified) {
          apiClient.post('/auth/sync-verification').catch(() => {});
        }
        if (data?.data) {
          return { ...data, data: { ...data.data, isVerified: true }, isVerified: true };
        }
        return { ...data, isVerified: true };
      }

      return data;
    } catch (err: any) {
      if (!err.response) {
        return rejectWithValue('خطأ في الشبكة: تحقق من الاتصال أو عنوان السيرفر');
      }
      return rejectWithValue(err.response?.data?.message || 'انتهت الجلسة');
    }
  }
);

export const checkFirstLaunch = createAsyncThunk(
  'auth/checkFirstLaunch',
  async (_, { rejectWithValue }) => {
    try {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      return value === 'true';
    } catch (err) {
      return false;
    }
  }
);

export const toggleFavoriteShop = createAsyncThunk(
  'auth/toggleFavoriteShop',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users/shops/${shopId}/favorite`);
      return { shopId, isFavorited: response.data.isFavorited };
    } catch (err: any) {
      if (!err.response) {
        return rejectWithValue('خطأ في الشبكة: تحقق من الاتصال أو عنوان السيرفر');
      }
      return rejectWithValue(err.response?.data?.message || 'فشل تبديل المفضلة');
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/resendverification');
      return response.data;
    } catch (err: any) {
      if (!err.response) {
        return rejectWithValue('خطأ في الشبكة: تحقق من الاتصال أو عنوان السيرفر');
      }
      return rejectWithValue(err.response?.data?.message || 'فشل إعادة إرسال رسالة التحقق');
    }
  }
);

export const updateMyProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ name, email, imageUri }: { name?: string; email?: string; imageUri?: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (email) formData.append('email', email);
      
      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('avatar', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      const response = await apiClient.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      if (!err.response) {
        return rejectWithValue('خطأ في الشبكة: السيرفر غير متاح');
      }
      return rejectWithValue(err.response?.data?.message || 'فشل التحديث');
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async ({ currentPassword, newPassword }: any, { rejectWithValue }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        return rejectWithValue('يجب تسجيل الدخول أولاً');
      }

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await firebaseUpdatePassword(currentUser, newPassword);

      // Keep backend/Firebase Admin in sync
      await apiClient.put('/auth/updatepassword', { newPassword });
      return { message: 'تم تحديث كلمة المرور بنجاح' };
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return rejectWithValue('كلمة المرور الحالية غير صحيحة');
      }
      if (!err.response && err.message) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'فشل تحديث كلمة المرور');
    }
  }
);

export const syncEmailVerification = createAsyncThunk(
  'auth/syncEmailVerification',
  async (_, { rejectWithValue }) => {
    try {
      if (!auth.currentUser) {
        return rejectWithValue('لا يوجد مستخدم مسجّل');
      }
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) {
        return rejectWithValue('البريد لم يُؤكَّد بعد');
      }
      const token = await auth.currentUser.getIdToken(true);
      await safeSetItem('token', token);
      const response = await apiClient.post('/auth/sync-verification');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'فشل التحقق');
    }
  }
);

/** Browse as guest: clear Firebase session so API interceptor won't leak prior account tokens. */
export const startGuestMode = createAsyncThunk('auth/startGuestMode', async () => {
  try {
    if (auth?.currentUser) {
      await signOut(auth);
    }
  } catch {
    // continue into guest mode even if Firebase signOut fails
  }
  await clearAuthToken();
  return true;
});

export const signOutUser = createAsyncThunk('auth/signOutUser', async () => {
  try {
    if (auth?.currentUser) {
      await signOut(auth);
    }
  } catch {
    // ignore
  }
  await clearAuthToken();
  return true;
});


export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  hasShop: boolean;
  favoriteShops?: string[];
}

interface AuthState {
  user: any;
  profile: any;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  isInitialLoading: boolean;
  hasSeenOnboarding: boolean | null;
  authEntryScreen: 'Login' | 'Register' | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isGuest: false,
  isEmailVerified: false,
  isProfileComplete: false,
  isInitialLoading: true, // New state to handle persistence check
  hasSeenOnboarding: null,
  authEntryScreen: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      clearAuthToken();
      state.user = null;
      state.profile = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.isEmailVerified = false;
      state.error = null;
      state.authEntryScreen = null;
    },
    enterGuestMode: (state) => {
      state.isGuest = true;
      state.isAuthenticated = false;
      state.isEmailVerified = false;
      state.isInitialLoading = false;
      state.user = null;
      state.profile = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.hasSeenOnboarding = true;
      state.authEntryScreen = null;
    },
    exitGuestForAuth: (state, action: { payload: 'Login' | 'Register' }) => {
      clearAuthToken();
      state.isGuest = false;
      state.isAuthenticated = false;
      state.isEmailVerified = false;
      state.user = null;
      state.profile = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.authEntryScreen = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuthEntryScreen: (state) => {
      state.authEntryScreen = null;
    },
    setHasSeenOnboarding: (state, action: any) => {
      state.hasSeenOnboarding = action.payload;
    },
    setOnboardingComplete: (state) => {
      state.hasSeenOnboarding = true;
    },
    setEmailVerified: (state, action: any) => {
      state.isEmailVerified = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: any) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.token = action.payload.token;
        state.user = action.payload; // Fixed: Payload is the user object
        state.isEmailVerified = action.payload.isVerified || false;
        state.isProfileComplete = action.payload.isProfileComplete || false;
      })
      .addCase(register.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: any) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.token = action.payload.token;
        state.user = action.payload; // Fixed: Payload is the user object
        state.isEmailVerified = action.payload.isVerified || false;
        state.isProfileComplete = action.payload.isProfileComplete || false;
      })
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startGuestMode.fulfilled, (state) => {
        state.isGuest = true;
        state.isAuthenticated = false;
        state.isEmailVerified = false;
        state.isInitialLoading = false;
        state.user = null;
        state.profile = null;
        state.token = null;
        state.error = null;
        state.loading = false;
        state.hasSeenOnboarding = true;
        state.authEntryScreen = null;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isGuest = false;
        state.isEmailVerified = false;
        state.error = null;
        state.authEntryScreen = null;
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        // We don't set global loading to true here to avoid full-screen loaders 
        // during background refreshes, except for the first time.
      })
      .addCase(getMe.fulfilled, (state, action: any) => {
        // Don't overwrite an active guest session
        if (state.isGuest) {
          state.loading = false;
          state.isInitialLoading = false;
          return;
        }
        state.loading = false;
        state.isInitialLoading = false; // Check complete
        state.isAuthenticated = true;
        state.user = action.payload.data || action.payload; // Fixed: Support flat or nested payload
        state.profile = action.payload.profile;
        const raw = action.payload.data || action.payload;
        const email = raw?.email || '';
        const isPhoneAccount = String(email).endsWith('@phone.aluna.app') || !!raw?.phone;
        state.isEmailVerified =
          isPhoneAccount ||
          action.payload.data?.isVerified ||
          action.payload.isVerified ||
          false;
        state.isProfileComplete = action.payload.isProfileComplete || false;
      })
      .addCase(getMe.rejected, (state, action: any) => {
        state.loading = false;
        state.isInitialLoading = false; // Check complete (failed)
        // Keep guest session if user already chose browse-as-guest
        if (!state.isGuest) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.isEmailVerified = false;
        }
      })
      // Resend Verification
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerification.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sync Email Verification
      .addCase(syncEmailVerification.fulfilled, (state, action: any) => {
        state.isEmailVerified = true;
        state.user = { ...state.user, ...action.payload, isVerified: true };
      })
      // Update My Profile
      .addCase(updateMyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMyProfile.fulfilled, (state, action: any) => {
        state.loading = false;
        state.profile = action.payload.data;
        // Sync user state if it has changed (e.g., avatar)
        // Check both action.payload.data.user (populated) and action.payload.user (if returned directly)
        const updatedUser = action.payload.data?.user || action.payload.user || action.payload;
        if (updatedUser) {
          state.user = { 
            ...state.user, 
            ...updatedUser,
            avatar: updatedUser.avatar || updatedUser.profilePicture || state.user?.avatar,
            profilePicture: updatedUser.profilePicture || updatedUser.avatar || state.user?.profilePicture,
          };
        }
      })
      .addCase(updateMyProfile.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // checkFirstLaunch
      .addCase(checkFirstLaunch.fulfilled, (state, action) => {
        state.hasSeenOnboarding = action.payload;
      })
      // Toggle Favorite Shop
      .addCase(toggleFavoriteShop.fulfilled, (state, action) => {
        if (!state.user) return;
        const { shopId, isFavorited } = action.payload;
        if (!state.user.favoriteShops) state.user.favoriteShops = [];
        if (isFavorited) {
          if (!state.user.favoriteShops.includes(shopId)) {
            state.user.favoriteShops.push(shopId);
          }
        } else {
          state.user.favoriteShops = state.user.favoriteShops.filter((id: string) => id !== shopId);
        }
      });
  },
});

export const { logout, clearError, setHasSeenOnboarding, setOnboardingComplete, setEmailVerified, enterGuestMode, exitGuestForAuth, clearAuthEntryScreen } = authSlice.actions;
export default authSlice.reducer;
