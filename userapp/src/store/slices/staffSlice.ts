import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { Service } from './serviceSlice';

export interface StaffMember {
  _id: string;
  shopId: string;
  name: string;
  role: string;
  avatar?: string;
  servicesProvided: Service[];
  workingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  blockedDates: string[];
}

interface StaffState {
  staffList: StaffMember[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  actionError: string | null;
  success: boolean;
}

const initialState: StaffState = {
  staffList: [],
  loading: false,
  actionLoading: false,
  error: null,
  actionError: null,
  success: false,
};

export const fetchStaff = createAsyncThunk(
  'staff/fetchAll',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/owner/shops/${shopId}/staff`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الموظفين');
    }
  }
);

export const addStaff = createAsyncThunk(
  'staff/add',
  async ({ shopId, formData }: { shopId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/owner/shops/${shopId}/staff`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إضافة الموظف');
    }
  }
);

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ shopId, staffId, formData }: { shopId: string; staffId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/owner/shops/${shopId}/staff/${staffId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث الموظف');
    }
  }
);

export const deleteStaff = createAsyncThunk(
  'staff/delete',
  async ({ shopId, staffId }: { shopId: string; staffId: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/owner/shops/${shopId}/staff/${staffId}`);
      return staffId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل حذف الموظف');
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearStaffState: (state) => {
      state.error = null;
      state.actionError = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Staff
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Staff
      .addCase(addStaff.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.success = false;
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        state.staffList.push(action.payload);
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Update Staff
      .addCase(updateStaff.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.success = false;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const index = state.staffList.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.staffList[index] = action.payload;
        }
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Delete Staff
      .addCase(deleteStaff.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.staffList = state.staffList.filter((s) => s._id !== action.payload);
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearStaffState } = staffSlice.actions;
export default staffSlice.reducer;
