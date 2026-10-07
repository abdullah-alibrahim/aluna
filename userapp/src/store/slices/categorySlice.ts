import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addLoading: boolean;
  addError: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
  addLoading: false,
  addError: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/categories');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحميل التصنيفات');
    }
  }
);

export const addCategory = createAsyncThunk(
  'categories/add',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/admin/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إضافة التصنيف');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/admin/categories/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث التصنيف');
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoryError: (state) => {
      state.addError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addCategory.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.addLoading = false;
        // Append new category to the beginning of the list
        state.categories.unshift(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload as string;
      })
      // Update
      .addCase(updateCategory.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.addLoading = false;
        const index = state.categories.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload as string;
      });
  },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
