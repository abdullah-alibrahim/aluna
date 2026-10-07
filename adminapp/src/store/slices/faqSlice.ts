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
      const response = await apiClient.get('/admin/faqs');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الأسئلة الشائعة');
    }
  }
);

export const addFAQ = createAsyncThunk(
  'faq/add',
  async (faqData: { question: string; answer: string; target: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/admin/faqs', faqData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إضافة السؤال');
    }
  }
);

export const updateFAQ = createAsyncThunk(
  'faq/update',
  async ({ id, data }: { id: string; data: Partial<{ question: string; answer: string; target: string }> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/admin/faqs/${id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث السؤال');
    }
  }
);

export const toggleFAQStatus = createAsyncThunk(
  'faq/toggleStatus',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/faqs/${id}/toggle`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تبديل الحالة');
    }
  }
);

export const deleteFAQ = createAsyncThunk(
  'faq/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/faqs/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل حذف السؤال');
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
      
    // Add
    builder
      .addCase(addFAQ.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addFAQ.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.faqs.unshift(action.payload);
      })
      .addCase(addFAQ.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updateFAQ.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateFAQ.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.faqs.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.faqs[index] = action.payload;
        }
      })
      .addCase(updateFAQ.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Toggle
    builder
      .addCase(toggleFAQStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleFAQStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.faqs.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.faqs[index].isActive = action.payload.isActive;
        }
      })
      .addCase(toggleFAQStatus.rejected, (state) => {
        state.actionLoading = false;
      });

    // Delete
    builder
      .addCase(deleteFAQ.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteFAQ.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.faqs = state.faqs.filter(f => f._id !== action.payload);
      })
      .addCase(deleteFAQ.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export default faqSlice.reducer;
