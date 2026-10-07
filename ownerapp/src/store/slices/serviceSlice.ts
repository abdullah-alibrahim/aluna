import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Service {
  _id: string;
  shopId: string;
  categoryId: { _id: string; name: string } | string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

interface ServiceState {
  services: Service[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  actionError: string | null;
  success: boolean;
}

const initialState: ServiceState = {
  services: [],
  loading: false,
  actionLoading: false,
  error: null,
  actionError: null,
  success: false,
};

export const fetchServices = createAsyncThunk(
  'services/fetchAll',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/owner/shops/${shopId}/services`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الخدمات');
    }
  }
);

export const addService = createAsyncThunk(
  'services/add',
  async ({ shopId, formData }: { shopId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/owner/shops/${shopId}/services`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إضافة الخدمة');
    }
  }
);

export const updateService = createAsyncThunk(
  'services/update',
  async ({ shopId, serviceId, formData }: { shopId: string; serviceId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/owner/shops/${shopId}/services/${serviceId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث الخدمة');
    }
  }
);

export const deleteService = createAsyncThunk(
  'services/delete',
  async ({ shopId, serviceId }: { shopId: string; serviceId: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/owner/shops/${shopId}/services/${serviceId}`);
      return serviceId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل حذف الخدمة');
    }
  }
);

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    clearServiceState: (state) => {
      state.error = null;
      state.actionError = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Services
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Service
      .addCase(addService.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.success = false;
      })
      .addCase(addService.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        state.services.push(action.payload);
      })
      .addCase(addService.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Update Service
      .addCase(updateService.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.success = false;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const index = state.services.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Delete Service
      .addCase(deleteService.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.services = state.services.filter((s) => s._id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearServiceState } = serviceSlice.actions;
export default serviceSlice.reducer;
