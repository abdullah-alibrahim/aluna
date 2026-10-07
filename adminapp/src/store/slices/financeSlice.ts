import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Withdrawal {
  _id: string;
  ownerId: { _id: string; name: string; email: string };
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNote?: string;
  payoutDetails?: string;
  createdAt: string;
}

export interface WalletBalance {
  _id: string;
  ownerId: { _id: string; name: string; email: string };
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface Payout {
  _id: string;
  ownerId: { _id: string; name: string; email: string };
  shopId?: { _id: string; name: string };
  amount: number;
  status: string;
  referenceId?: string;
  adminNote?: string;
  createdAt: string;
}

interface FinanceState {
  withdrawals: Withdrawal[];
  owedBalances: WalletBalance[];
  payoutHistory: Payout[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;
}

const initialState: FinanceState = {
  withdrawals: [],
  owedBalances: [],
  payoutHistory: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

export const fetchWithdrawals = createAsyncThunk(
  'finance/fetchWithdrawals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/withdrawals');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب طلبات السحب');
    }
  }
);

export const approveWithdrawal = createAsyncThunk(
  'finance/approveWithdrawal',
  async ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/withdrawals/${id}/approve`, { status, adminNote });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث طلب السحب');
    }
  }
);

export const fetchOwedBalances = createAsyncThunk(
  'finance/fetchOwedBalances',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/finances/owed');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب المستحقات');
    }
  }
);

export const fetchPayoutHistory = createAsyncThunk(
  'finance/fetchPayoutHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/finances/payouts');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب سجل المدفوعات');
    }
  }
);

export const createPayout = createAsyncThunk(
  'finance/createPayout',
  async (payoutData: { ownerId: string; amount: number; referenceId?: string; adminNote?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/admin/finances/payouts', payoutData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تسجيل الدفع');
    }
  }
);

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearFinanceError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Withdrawals
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Approve Withdrawal
      .addCase(approveWithdrawal.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveWithdrawal.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.withdrawals.findIndex(w => w._id === action.payload._id);
        if (index !== -1) {
          state.withdrawals[index] = action.payload;
        }
      })
      .addCase(approveWithdrawal.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })

      // Fetch Owed Balances
      .addCase(fetchOwedBalances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwedBalances.fulfilled, (state, action) => {
        state.loading = false;
        state.owedBalances = action.payload;
      })
      .addCase(fetchOwedBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Payouts
      .addCase(fetchPayoutHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayoutHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.payoutHistory = action.payload;
      })
      .addCase(fetchPayoutHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Payout
      .addCase(createPayout.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createPayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Prepend new payout
        state.payoutHistory.unshift(action.payload);
      })
      .addCase(createPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearFinanceError } = financeSlice.actions;
export default financeSlice.reducer;
