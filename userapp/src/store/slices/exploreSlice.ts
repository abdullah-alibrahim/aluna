import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { Shop } from './shopSlice';
import { isStoreDemoMode, storeDemoShops } from '../storeDemoData';

interface ExploreFilters {
  categoryId?: string;
  searchQuery?: string;
  sortBy?: 'featured' | 'rating' | 'price_low' | 'price_high';
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  distance?: number; // radius in meters
}

interface ExploreState {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  filters: ExploreFilters;
}

const initialState: ExploreState = {
  shops: [],
  loading: false,
  error: null,
  filters: {
    sortBy: 'featured',
    distance: 10000, // 10km default
  },
};

export const fetchExploreShops = createAsyncThunk(
  'explore/fetchShops',
  async (params: { cityId?: string; latitude?: number; longitude?: number } & ExploreFilters, { rejectWithValue }) => {
    try {
      if (isStoreDemoMode()) {
        let shops = [...storeDemoShops] as unknown as Shop[];
        if (params.categoryId && params.categoryId !== 'all') {
          shops = shops.filter((s: any) => s.categoryIds?.includes(params.categoryId));
        }
        if (params.searchQuery) {
          const q = params.searchQuery.trim();
          shops = shops.filter((s: any) => s.name.includes(q) || s.address?.includes(q));
        }
        return shops;
      }

      const queryParams = new URLSearchParams();
      
      if (params.cityId) queryParams.append('cityId', params.cityId);
      // Backend $geoNear needs lng/lat; radius (meters) only applies with coordinates
      if (
        params.latitude != null &&
        params.longitude != null &&
        Number.isFinite(Number(params.latitude)) &&
        Number.isFinite(Number(params.longitude))
      ) {
        queryParams.append('latitude', String(params.latitude));
        queryParams.append('longitude', String(params.longitude));
        if (params.distance != null) {
          queryParams.append('radius', String(params.distance));
        }
      }
      
      if (params.categoryId && params.categoryId !== 'all') queryParams.append('categoryId', params.categoryId);
      if (params.searchQuery) queryParams.append('search', params.searchQuery);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());

      const response = await apiClient.get(`/users/shops?${queryParams.toString()}`);
      return response.data?.length ? response.data : storeDemoShops;
    } catch (err: any) {
      if (isStoreDemoMode()) return storeDemoShops as unknown as Shop[];
      return rejectWithValue(err.response?.data?.message || 'فشل جلب الصالونات');
    }
  }
);

const exploreSlice = createSlice({
  name: 'explore',
  initialState,
  reducers: {
    setExploreFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetExploreFilters: (state) => {
      // Keep category if we want, but basically reset to defaults
      const currentCategory = state.filters.categoryId;
      state.filters = {
        categoryId: currentCategory,
        sortBy: 'featured',
        distance: 10000,
      };
    },
    clearExploreState: (state) => {
      state.shops = [];
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExploreShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExploreShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload;
      })
      .addCase(fetchExploreShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setExploreFilters, resetExploreFilters, clearExploreState } = exploreSlice.actions;
export default exploreSlice.reducer;
