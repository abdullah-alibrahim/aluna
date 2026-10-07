import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { Platform } from 'react-native';

export interface Banner {
  _id: string;
  imageUrl: string;
  targetLink?: string;
  isActive: boolean;
  createdAt: string;
}

interface BannerState {
  banners: Banner[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: BannerState = {
  banners: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchBanners = createAsyncThunk(
  'banners/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/banners');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب البنرات');
    }
  }
);

export const addBanner = createAsyncThunk(
  'banners/add',
  async ({ imageUri, targetLink }: { imageUri: string; targetLink?: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop() || 'banner.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('image', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type,
      } as any);

      if (targetLink) {
        formData.append('targetLink', targetLink);
      }

      const response = await apiClient.post('/admin/banners', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إضافة البنر');
    }
  }
);

export const toggleBannerStatus = createAsyncThunk(
  'banners/toggle',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/banners/${id}/toggle`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تبديل حالة البنر');
    }
  }
);

export const deleteBanner = createAsyncThunk(
  'banners/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/banners/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل حذف البنر');
    }
  }
);

const bannerSlice = createSlice({
  name: 'banners',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addBanner.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.banners.unshift(action.payload);
      })
      .addCase(addBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // Toggle
      .addCase(toggleBannerStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleBannerStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.banners.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.banners[index] = action.payload;
        }
      })
      .addCase(toggleBannerStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteBanner.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.banners = state.banners.filter(b => b._id !== action.payload);
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default bannerSlice.reducer;
