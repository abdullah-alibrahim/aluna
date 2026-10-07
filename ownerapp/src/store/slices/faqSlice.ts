import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  target: 'user' | 'owner';
  isActive: boolean;
  createdAt: string;
}

interface FAQState {
  faqs: FAQ[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: FAQState = {
  faqs: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchFAQs = createAsyncThunk(
  'faq/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/faqs/owner');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الأسئلة الشائعة');
    }
  }
);

const faqSlice = createSlice({
  name: 'faq',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchFAQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFAQs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchFAQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
    // Only fetch is needed for owner app
  },
});

export default faqSlice.reducer;
