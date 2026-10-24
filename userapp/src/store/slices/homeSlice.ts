import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { brandCarouselBanners } from '@/lib/brandBanners';
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
  imageUrl?: string;
  imageLocal?: number;
  targetLink?: string;
  isActive?: boolean;
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

      // Do not let a slow/failed banners or categories request take the whole
      // home screen down with it. The shops list is the critical request.
      const [categoriesResult, bannersResult, shopsResult] = await Promise.allSettled([
        apiClient.get('/users/categories'),
        apiClient.get('/users/banners'),
        apiClient.get(cityId ? `/users/shops?cityId=${cityId}` : '/users/shops'),
      ]);

      if (shopsResult.status === 'rejected') {
        throw shopsResult.reason;
      }

      const categoriesBody =
        categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : null;
      const bannersBody =
        bannersResult.status === 'fulfilled' ? bannersResult.value.data : null;
      const shopsBody = shopsResult.value.data;

      // API list endpoints may return either a bare array or a paginated
      // `{ data: [...] }` / `{ shops: [...] }` envelope. Normalize both so the
      // real Vercel data is used instead of silently falling back to demo data.
      const categoriesData = Array.isArray(categoriesBody)
        ? categoriesBody
        : categoriesBody?.categories || categoriesBody?.data || [];
      const bannersData = Array.isArray(bannersBody)
        ? bannersBody
        : bannersBody?.banners || bannersBody?.data || [];
      const shopsData = Array.isArray(shopsBody)
        ? shopsBody
        : shopsBody?.shops || shopsBody?.data || [];

      const categories = categoriesData.length
        ? categoriesData
        : isStoreDemoMode()
          ? storeDemoCategories
          : [];
      // Always lead with Aluna brand carousel art; append remote banners if any
      const remote = (bannersData || []).filter((b: Banner) => b?.imageUrl);
      const banners = [...brandCarouselBanners, ...remote];
      const shops = shopsData.length
        ? shopsData
        : isStoreDemoMode()
          ? storeDemoShops
          : [];

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
