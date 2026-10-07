import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface PlatformSettings {
  _id?: string;
  platformCommissionRate: number;
  stripePublicKey: string;
  stripeSecretKey: string;
  currency?: string;
  currencyCode?: string;
  depositPercent?: number;
  noShowFeePercent?: number;
  freeCancelHours?: number;
  isGlobal?: boolean;
}

interface SettingState {
  settings: PlatformSettings | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
  updateError: string | null;
  updateSuccess: boolean;
}

const initialState: SettingState = {
  settings: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
  updateSuccess: false,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/settings');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحميل الإعدادات');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (settingsData: Partial<PlatformSettings>, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/admin/settings', settingsData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث الإعدادات');
    }
  }
);

const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearUpdateStatus: (state) => {
      state.updateError = null;
      state.updateSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateSettings.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.settings = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload as string;
        state.updateSuccess = false;
      });
  },
});

export const { clearUpdateStatus } = settingSlice.actions;
export default settingSlice.reducer;
