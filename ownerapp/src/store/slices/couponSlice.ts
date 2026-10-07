import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Coupon {
  _id: string;
  code: string;
  discountPercentage: number;
  maxDiscount?: number;
  expiryDate: string;
  shopId: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}

interface CouponState {
  coupons: Coupon[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: CouponState = {
  coupons: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchCoupons = createAsyncThunk(
  'coupons/fetchAll',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/owner/shops/${shopId}/coupons`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الكوبونات');
    }
  }
);

export const createCoupon = createAsyncThunk(
  'coupons/create',
  async ({ shopId, data }: { shopId: string; data: Partial<Coupon> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/owner/shops/${shopId}/coupons`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إنشاء الكوبون');
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'coupons/update',
  async ({ shopId, couponId, data }: { shopId: string; couponId: string; data: Partial<Coupon> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/owner/shops/${shopId}/coupons/${couponId}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث الكوبون');
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'coupons/delete',
  async ({ shopId, couponId }: { shopId: string; couponId: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/owner/shops/${shopId}/coupons/${couponId}`);
      return couponId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل حذف الكوبون');
    }
  }
);

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Coupon
      .addCase(createCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // Update Coupon
      .addCase(updateCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.coupons.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // Delete Coupon
      .addCase(deleteCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.coupons = state.coupons.filter(c => c._id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;
