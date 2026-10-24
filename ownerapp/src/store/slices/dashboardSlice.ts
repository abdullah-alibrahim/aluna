import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

// Types
export interface Shop {
  _id: string;
  name: string;
  address: string;
  isApproved: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  images: string[];
  operatingHours?: {
    day: string;
    open?: string;
    close?: string;
    isClosed: boolean;
  }[];
}

export interface TopService {
  name: string;
  count: number;
}

export interface ShopAnalytics {
  monthlyRevenue: number;
  topServices: TopService[];
  cancellationRate: number;
  upcomingAppointments: number;
}

interface DashboardState {
  shops: Shop[];
  selectedShopId: string | null;
  analytics: ShopAnalytics | null;
  isLoadingShops: boolean;
  isLoadingAnalytics: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  shops: [],
  selectedShopId: null,
  analytics: null,
  isLoadingShops: false,
  isLoadingAnalytics: false,
  error: null,
};

// Async Thunks
export const fetchOwnerShops = createAsyncThunk(
  'dashboard/fetchOwnerShops',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/owner/shops');
      const data = response.data;
      return Array.isArray(data) ? data : data?.shops || data?.data || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'فشل جلب مراكز تجميلك'
      );
    }
  }
);

export const fetchShopAnalytics = createAsyncThunk(
  'dashboard/fetchShopAnalytics',
  async (shopId: string, { rejectWithValue }) => {
    const fetchAnalytics = async () => {
      const response = await apiClient.get(`/owner/shops/${shopId}/analytics`);
      return response.data;
    };

    try {
      return await fetchAnalytics();
    } catch (error: any) {
      // The first dashboard request after login can race the Vercel cold start.
      // Retry once before surfacing an error / leaving the cards at zero.
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return await fetchAnalytics();
      } catch (retryError: any) {
        return rejectWithValue(
          retryError.response?.data?.message || 'فشل جلب تحليلات مركز التجميل'
        );
      }
    }
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    setSelectedShopId: (state, action: PayloadAction<string>) => {
      state.selectedShopId = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch Shops
    builder
      .addCase(fetchOwnerShops.pending, (state) => {
        state.isLoadingShops = true;
        state.error = null;
      })
      .addCase(fetchOwnerShops.fulfilled, (state, action) => {
        state.isLoadingShops = false;
        state.shops = action.payload;
        // Automatically select the first shop if none is selected
        if (action.payload.length > 0 && !state.selectedShopId) {
          state.selectedShopId = action.payload[0]._id;
        }
      })
      .addCase(fetchOwnerShops.rejected, (state, action) => {
        state.isLoadingShops = false;
        state.error = action.payload as string;
      });

    // Fetch Analytics
    builder
      .addCase(fetchShopAnalytics.pending, (state) => {
        state.isLoadingAnalytics = true;
        state.error = null;
      })
      .addCase(fetchShopAnalytics.fulfilled, (state, action) => {
        state.isLoadingAnalytics = false;
        state.analytics = action.payload;
      })
      .addCase(fetchShopAnalytics.rejected, (state, action) => {
        state.isLoadingAnalytics = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboardError, setSelectedShopId } = dashboardSlice.actions;
export default dashboardSlice.reducer;
