import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Booking {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string; avatar?: string };
  shopId: { _id: string; name: string; address: string };
  serviceIds: { _id: string; name: string; duration: number; price: number }[];
  staffId: { _id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: string;
  totalPrice: number;
  originalPrice: number;
  discountAmount: number;
  depositAmount?: number;
  feeCharged?: number;
  feeType?: string;
  createdAt: string;
}

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  error: null,
  hasMore: true,
};

export const fetchShopBookings = createAsyncThunk(
  'bookings/fetchShopBookings',
  async ({ shopId, limit = 20, skip = 0 }: { shopId: string; limit?: number; skip?: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/owner/shops/${shopId}/bookings`, {
        params: { limit, skip },
      });
      return { data: response.data, skip };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الحجوزات');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ bookingId, status }: { bookingId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/owner/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث حالة الحجز');
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearBookings: (state) => {
      state.bookings = [];
      state.hasMore = true;
    },
    resetBookings: (state) => {
      state.bookings = [];
      state.hasMore = true;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShopBookings.fulfilled, (state, action) => {
        state.loading = false;
        const { data, skip } = action.payload as any;
        if (skip === 0) {
          state.bookings = data;
        } else {
          state.bookings = [...state.bookings, ...data];
        }
        state.hasMore = data.length > 0;
      })
      .addCase(fetchShopBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      });
  },
});

export const { clearBookings, resetBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
