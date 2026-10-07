import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Shop {
  _id: string;
  name: string;
  description?: string;
  address: string;
  cityId: { _id: string; name: string };
  ownerId: { _id: string; name: string; email: string };
  location: { type: string; coordinates: [number, number] };
  images: string[];
  isApproved: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isActive: boolean;
  isFeatured: boolean;
  operatingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
    _id: string;
  }[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface ShopState {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;
}

const initialState: ShopState = {
  shops: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

export const fetchAllShops = createAsyncThunk(
  'shops/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/shops');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الصالونات');
    }
  }
);

export const updateShopStatus = createAsyncThunk(
  'shops/updateStatus',
  async (
    { id, status, rejectionReason }: { id: string; status: 'approved' | 'rejected'; rejectionReason?: string },
    { rejectWithValue }
  ) => {
    try {
      const body: { status: string; rejectionReason?: string } = { status };
      if (status === 'rejected' && rejectionReason?.trim()) {
        body.rejectionReason = rejectionReason.trim();
      }
      const response = await apiClient.patch(`/admin/shops/${id}/status`, body);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث حالة الصالون');
    }
  }
);

const shopSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    clearShopError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAllShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload;
      })
      .addCase(fetchAllShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update Status
      .addCase(updateShopStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateShopStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.shops.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          // Merge so nested ownerId/cityId stay populated
          state.shops[index] = {
            ...state.shops[index],
            isApproved: action.payload.isApproved,
            approvalStatus: action.payload.approvalStatus,
            rejectionReason: action.payload.rejectionReason,
          };
        }
      })
      .addCase(updateShopStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearShopError } = shopSlice.actions;
export default shopSlice.reducer;
