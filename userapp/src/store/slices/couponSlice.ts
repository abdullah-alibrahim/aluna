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
  status: 'available' | 'collected' | 'used';
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
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/users/coupons');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب الكوبونات');
    }
  }
);

export const collectCoupon = createAsyncThunk(
  'coupons/collect',
  async (couponId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users/coupons/${couponId}/collect`);
      return { couponId, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل جمع الكوبون');
    }
  }
);

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
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
      // Collect Coupon
      .addCase(collectCoupon.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(collectCoupon.fulfilled, (state, action) => {
        state.actionLoading = false;
        const coupon = state.coupons.find(c => c._id === action.payload.couponId);
        if (coupon) {
          coupon.status = 'collected';
        }
      })
      .addCase(collectCoupon.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;
