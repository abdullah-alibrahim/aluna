import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface City {
  _id: string;
  name: string;
  coordinates: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  isActive: boolean;
}

interface CityState {
  cities: City[];
  loading: boolean;
  error: string | null;
  addLoading: boolean;
  addError: string | null;
}

const initialState: CityState = {
  cities: [],
  loading: false,
  error: null,
  addLoading: false,
  addError: null,
};

export const fetchCities = createAsyncThunk(
  'cities/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/cities');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحميل المدن');
    }
  }
);

export const addCity = createAsyncThunk(
  'cities/add',
  async (cityData: { name: string; longitude: number; latitude: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/admin/cities', cityData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل إضافة المدينة');
    }
  }
);

export const updateCity = createAsyncThunk(
  'cities/update',
  async ({ id, cityData }: { id: string; cityData: { name: string; longitude: number; latitude: number } }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/admin/cities/${id}`, cityData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'فشل تحديث المدينة');
    }
  }
);

const citySlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    clearCityError: (state) => {
      state.addError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addCity.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(addCity.fulfilled, (state, action) => {
        state.addLoading = false;
        state.cities.unshift(action.payload);
      })
      .addCase(addCity.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload as string;
      })
      // Update
      .addCase(updateCity.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(updateCity.fulfilled, (state, action) => {
        state.addLoading = false;
        const index = state.cities.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.cities[index] = action.payload;
        }
      })
      .addCase(updateCity.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload as string;
      });
  },
});

export const { clearCityError } = citySlice.actions;
export default citySlice.reducer;
