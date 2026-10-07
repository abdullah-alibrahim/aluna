import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface StaffMember {
  _id: string;
  shopId: string;
  name: string;
  role: string;
  avatar?: string;
  branchId?: string | { _id: string; name: string; isMain?: boolean };
  servicesProvided: ({ _id: string; name: string } | string)[];
  workingHours?: {
    day: string;
    start: string;
    end: string;
    isOff: boolean;
    breaks?: { start: string; end: string }[];
  }[];
  isActive?: boolean;
}

interface StaffState {
  staffList: StaffMember[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: StaffState = {
  staffList: [],
  loading: false,
  actionLoading: false,
  error: null,
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
  async (
    { shopId, staffId, formData }: { shopId: string; staffId: string; formData: FormData },
    { rejectWithValue }
  ) => {
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
    clearStaffError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(addStaff.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.staffList.unshift(action.payload);
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStaff.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.staffList.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.staffList[idx] = action.payload;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.staffList = state.staffList.filter((s) => s._id !== action.payload);
      });
  },
});

export const { clearStaffError } = staffSlice.actions;
export default staffSlice.reducer;
