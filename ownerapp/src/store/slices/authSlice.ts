import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import apiClient, { setAuthToken } from '../../api/client';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword as firebaseUpdatePassword } from 'firebase/auth';

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

      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      firebaseUser = userCredential.user;

      const firebaseToken = await userCredential.user.getIdToken();

      const payload = {
        name: userData.name,
        role: userData.role || 'owner',
        phone,
        gender: userData.gender,
        token: firebaseToken,
      };

      const response = await apiClient.post('/auth/register', payload);

      if (response.data.role !== 'owner') {
        await firebaseUser.delete().catch(() => {});
        return rejectWithValue('غير مصرح: لأصحاب الصالونات فقط');
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
      
      if (response.data.role !== 'owner') {
        return rejectWithValue('غير مصرح: لأصحاب الصالونات فقط');
      }
      if (response.data.status === 'blocked' || response.data.isBlocked) {
        return rejectWithValue('تم حظر حسابك. يرجى التواصل مع الدعم.');
      }

      await safeSetItem('token', response.data.token);
      return { ...response.data, isVerified: true, phone: phone.includes('@') ? undefined : phone };
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
  async (identifier: any, { rejectWithValue }) => {
    try {
      const raw = typeof identifier === 'string' ? identifier : identifier?.email || identifier?.phone || '';
      const digits = normalizePhone(raw);
      const email = raw.includes('@') ? raw : phoneToAuthEmail(digits);
      if (!email) {
        return rejectWithValue('أدخل رقم الهاتف');
      }
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
  async (data: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        return rejectWithValue('يجب تسجيل الدخول أولاً');
      }

      const credential = EmailAuthProvider.credential(currentUser.email, data.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await firebaseUpdatePassword(currentUser, data.newPassword);
      await apiClient.put('/auth/password', { newPassword: data.newPassword });
      return { message: 'تم تحديث كلمة المرور بنجاح' };
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return rejectWithValue('كلمة المرور الحالية غير صحيحة');
      }
      if (!err.response && err.message) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث كلمة المرور');
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

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (error) {
      console.log('Firebase sign out error', error);
    }
    await clearAuthToken();
    dispatch(authSlice.actions.logout());
  }
);

const initialState = {
  user: null,
  profile: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isEmailVerified: false,
  isProfileComplete: false,
  isInitialLoading: true, // New state to handle persistence check
  hasSeenOnboarding: null,
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
      state.isEmailVerified = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
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
        state.token = action.payload.token;
        state.user = action.payload; // Fixed: Payload is the user object
        state.isEmailVerified = action.payload.isVerified || false;
        state.isProfileComplete = action.payload.isProfileComplete || false;
      })
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        // We don't set global loading to true here to avoid full-screen loaders 
        // during background refreshes, except for the first time.
      })
      .addCase(getMe.fulfilled, (state, action: any) => {
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
        state.isInitialLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isEmailVerified = false;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isEmailVerified = false;
        state.error = null;
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
        const updatedUser = action.payload.data?.user || action.payload.user;
        if (updatedUser) {
          state.user = { 
            ...state.user, 
            ...updatedUser 
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
      });
  },
});

export const { logout, clearError, setHasSeenOnboarding, setOnboardingComplete, setEmailVerified } = authSlice.actions;
export default authSlice.reducer;
