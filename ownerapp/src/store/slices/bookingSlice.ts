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
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  error: null,
};

export const fetchShopBookings = createAsyncThunk(
  'bookings/fetchShopBookings',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/owner/shops/${shopId}/bookings`);
      return response.data;
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
        state.bookings = action.payload;
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

export const { clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
