import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Shop {
  _id: string;
  name: string;
  description?: string;
  address: string;
  cityId: { _id: string; name: string } | string;
  categoryIds?: ({ _id: string; name: string; image?: string } | string)[];
  ownerId: { _id: string; name: string; email: string } | string;
  location: { type: string; coordinates: [number, number] };
  images: string[];
  isApproved: boolean;
  isActive: boolean;
  isFeatured: boolean;
  operatingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
    _id?: string;
  }[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface ShopState {
  myShops: Shop[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: ShopState = {
  myShops: [],
  loading: false,
  error: null,
  success: false,
};

export const createShop = createAsyncThunk(
  'shops/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/owner/shops', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إنشاء الصالون');
    }
  }
);

export const fetchMyShops = createAsyncThunk(
  'shops/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/owner/shops');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل جلب صالوناتك');
    }
  }
);

export const updateShop = createAsyncThunk(
  'shops/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/owner/shops/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث الصالون');
    }
  }
);

const shopSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    clearShopState: (state) => {
      state.error = null;
      state.success = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Shop
      .addCase(createShop.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createShop.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch My Shops
      .addCase(fetchMyShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyShops.fulfilled, (state, action) => {
        state.loading = false;
        state.myShops = action.payload;
      })
      .addCase(fetchMyShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Shop
      .addCase(updateShop.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateShop.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update the shop in the list if it exists
        const index = state.myShops.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.myShops[index] = action.payload;
        }
      })
      .addCase(updateShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearShopState } = shopSlice.actions;
export default shopSlice.reducer;
