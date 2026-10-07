import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import {
  isStoreDemoMode,
  storeDemoBanners,
  storeDemoCategories,
  storeDemoCity,
  storeDemoShops,
} from '../storeDemoData';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface Banner {
  _id: string;
  imageUrl: string;
  targetLink?: string;
}

export interface Shop {
  _id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  images: string[];
  isFeatured: boolean;
  categoryIds?: string[];
  startingPrice?: number;
}

interface HomeState {
  categories: Category[];
  banners: Banner[];
  shops: Shop[];
  selectedCity: {
    _id: string;
    name: string;
    location?: { type: string; coordinates: number[] };
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: HomeState = {
  categories: [],
  banners: [],
  shops: [],
  selectedCity: null,
  loading: false,
  error: null,
};

export const fetchHomeData = createAsyncThunk(
  'home/fetchData',
  async (cityId: string | undefined | null, { rejectWithValue }) => {
    try {
      if (isStoreDemoMode()) {
        return {
          categories: storeDemoCategories,
          banners: storeDemoBanners,
          shops: storeDemoShops,
        };
      }

      const [categoriesRes, bannersRes, shopsRes] = await Promise.all([
        apiClient.get('/users/categories'),
        apiClient.get('/users/banners'),
        apiClient.get(cityId ? `/users/shops?cityId=${cityId}` : '/users/shops'),
      ]);

      const categories = categoriesRes.data?.length ? categoriesRes.data : storeDemoCategories;
      const banners = bannersRes.data?.length ? bannersRes.data : storeDemoBanners;
      const shops = shopsRes.data?.length ? shopsRes.data : storeDemoShops;

      return { categories, banners, shops };
    } catch (err: any) {
      if (isStoreDemoMode()) {
        return {
          categories: storeDemoCategories,
          banners: storeDemoBanners,
          shops: storeDemoShops,
        };
      }
      return rejectWithValue(err.response?.data?.message || 'فشل تحميل بيانات الرئيسية');
    }
  },
);

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
    },
    applyStoreDemoCity: (state) => {
      state.selectedCity = storeDemoCity;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.banners = action.payload.banners;
        state.shops = action.payload.shops;
        if (isStoreDemoMode() && !state.selectedCity) {
          state.selectedCity = storeDemoCity;
        }
      })
      .addCase(fetchHomeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCity, applyStoreDemoCity } = homeSlice.actions;

export default homeSlice.reducer;
