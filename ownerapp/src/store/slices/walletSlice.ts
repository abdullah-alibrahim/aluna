import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Wallet {
  _id: string;
  ownerId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  createdAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  ownerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  payoutDetails: string;
  processedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

interface WalletState {
  wallet: Wallet | null;
  withdrawals: WithdrawalRequest[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallet: null,
  withdrawals: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/owner/wallet');
      return response.data; // { wallet, withdrawals }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب المحفظة');
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'wallet/requestWithdrawal',
  async (data: { amount: number; payoutDetails: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/owner/wallet/withdraw', data);
      return response.data; // new withdrawal request
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل طلب السحب');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchWallet
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload.wallet;
        state.withdrawals = action.payload.withdrawals;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // requestWithdrawal
      .addCase(requestWithdrawal.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.withdrawals.unshift(action.payload);
        // Deduct from balance optimistically
        if (state.wallet) {
          state.wallet.balance -= action.payload.amount;
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default walletSlice.reducer;
