import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

// Types
export interface DashboardStats {
  pendingShops: number;
  pendingWithdrawals: number;
  openTickets: number;
  totalOwedBalance: number;
}

export interface Shop {
  _id: string;
  name: string;
  address: string;
  isApproved: boolean;
  ownerId: {
    _id: string;
    name: string;
    email: string;
  };
  cityId: {
    _id: string;
    name: string;
  };
}

interface DashboardState {
  stats: DashboardStats | null;
  pendingShops: Shop[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  pendingShops: [],
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/dashboard-stats');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'فشل جلب إحصائيات اللوحة'
      );
    }
  }
);

export const fetchPendingShops = createAsyncThunk(
  'dashboard/fetchPendingShops',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/shops/pending');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'فشل جلب الصالونات المعلّقة'
      );
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
  },
  extraReducers: (builder) => {
    // Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Pending Shops
    builder
      .addCase(fetchPendingShops.pending, (state) => {
        // Only show loading state if we don't have stats yet to prevent UI flash
        if (!state.stats) state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingShops.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingShops = action.payload;
      })
      .addCase(fetchPendingShops.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
