import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Booking {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string };
  shopId: {
    _id: string;
    name: string;
    address: string;
    requiresDeposit?: boolean;
    depositPercent?: number;
    noShowFeePercent?: number;
  };
  serviceIds: { _id: string; name: string; duration: number; price: number }[];
  staffId: { _id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: 'stripe' | 'cash';
  totalPrice: number;
  originalPrice: number;
  discountAmount: number;
  depositAmount?: number;
  depositPaid?: boolean;
  feeCharged?: number;
  feeType?: 'none' | 'cancellation' | 'no_show';
  isReviewed?: boolean;
  createdAt: string;
}

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  bookingFlowLoading: boolean;
  error: string | null;
  // Booking Flow State
  flowServices: any[];
  flowStaff: any[];
  flowBranches: any[];
  availableSlots: any[];
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  bookingFlowLoading: false,
  error: null,
  flowServices: [],
  flowStaff: [],
  flowBranches: [],
  availableSlots: [],
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

// --- USER APP THUNKS ---
export const getShopDetailsForBooking = createAsyncThunk(
  'bookings/getShopDetails',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const { getStoreDemoShopDetails, isStoreDemoMode } = await import('../storeDemoData');
      if (isStoreDemoMode()) {
        return getStoreDemoShopDetails(shopId);
      }
      const response = await apiClient.get(`/users/shops/${shopId}`);
      return response.data; // { shop, services, staff }
    } catch (err: any) {
      const { getStoreDemoShopDetails, isStoreDemoMode } = await import('../storeDemoData');
      if (isStoreDemoMode()) return getStoreDemoShopDetails(shopId);
      return rejectWithValue(err.response?.data?.message || 'فشل تحميل تفاصيل الصالون.');
    }
  }
);

export const getAvailability = createAsyncThunk(
  'bookings/getAvailability',
  async (
    {
      shopId,
      dateStr,
      serviceQuery,
      staffId,
      timezone,
      branchId,
    }: {
      shopId: string;
      dateStr: string;
      serviceQuery: string;
      staffId: string;
      timezone?: string;
      branchId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { isStoreDemoMode, storeDemoSlots } = await import('../storeDemoData');
      if (isStoreDemoMode()) {
        return storeDemoSlots;
      }
      const tzParam = timezone ? `&timezone=${encodeURIComponent(timezone)}` : '';
      const branchParam = branchId ? `&branchId=${branchId}` : '';
      const response = await apiClient.get(
        `/users/shops/${shopId}/availability?date=${dateStr}&serviceIds=${serviceQuery}&staffId=${staffId}${tzParam}${branchParam}`
      );
      return response.data;
    } catch (err: any) {
      const { isStoreDemoMode, storeDemoSlots } = await import('../storeDemoData');
      if (isStoreDemoMode()) return storeDemoSlots;
      return rejectWithValue(err.response?.data?.message || 'فشل تحميل المواعيد المتاحة.');
    }
  }
);

export const lockBookingSlot = createAsyncThunk(
  'bookings/lockSlot',
  async (lockData: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/bookings/lock-slot', lockData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'الموعد محجوز أو غير متاح.');
    }
  }
);

export const createNewBooking = createAsyncThunk(
  'bookings/createNew',
  async (bookingData: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/bookings', bookingData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إنشاء الحجز.');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/users/bookings');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الحجوزات.');
    }
  }
);

export const createCheckoutSession = createAsyncThunk(
  'bookings/createCheckoutSession',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users/bookings/${bookingId}/checkout`);
      return response.data; // { sessionId, url, clientSecret, ephemeralKey, customer }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تهيئة الدفع.');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'bookings/verifyPayment',
  async ({ bookingId, sessionId }: { bookingId: string, sessionId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users/bookings/${bookingId}/verify-payment`, { sessionId });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل التحقق من الدفع.');
    }
  }
);

export const cancelMyBooking = createAsyncThunk(
  'bookings/cancelMyBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إلغاء الحجز.');
    }
  }
);

export const rescheduleMyBooking = createAsyncThunk(
  'bookings/rescheduleMyBooking',
  async (
    payload: { bookingId: string; date: string; startTime: string; endTime: string; staffId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { bookingId, ...body } = payload;
      const response = await apiClient.post(`/users/bookings/${bookingId}/reschedule`, body);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إعادة جدولة الحجز.');
    }
  }
);

export const createGroupBooking = createAsyncThunk(
  'bookings/createGroup',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/bookings/group', payload);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل الحجز الجماعي.');
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
      })
      // Fetch My Bookings (User App)
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelMyBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      // User Booking Flow
      .addCase(getShopDetailsForBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopDetailsForBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.flowServices = action.payload.services || [];
        state.flowStaff = action.payload.staff || [];
        state.flowBranches = action.payload.branches || [];
      })
      .addCase(rescheduleMyBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) state.bookings[index] = action.payload;
      })
      .addCase(getShopDetailsForBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAvailability.pending, (state) => {
        state.bookingFlowLoading = true;
      })
      .addCase(getAvailability.fulfilled, (state, action) => {
        state.bookingFlowLoading = false;
        state.availableSlots = action.payload;
      })
      .addCase(getAvailability.rejected, (state, action) => {
        state.bookingFlowLoading = false;
        state.availableSlots = [];
      });
  },
});

export const { clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
