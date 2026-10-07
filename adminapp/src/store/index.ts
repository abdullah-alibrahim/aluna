import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import notificationReducer from './slices/notificationSlice';
import categoryReducer from './slices/categorySlice';
import settingsReducer from './slices/settingSlice';
import cityReducer from './slices/citySlice';
import financeReducer from './slices/financeSlice';
import shopReducer from './slices/shopSlice';
import ticketReducer from './slices/ticketSlice';
import bookingReducer from './slices/bookingSlice';
import bannerReducer from './slices/bannerSlice';
import faqReducer from './slices/faqSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
    categories: categoryReducer,
    settings: settingsReducer,
    cities: cityReducer,
    finance: financeReducer,
    shops: shopReducer,
    tickets: ticketReducer,
    bookings: bookingReducer,
    banners: bannerReducer,
    faq: faqReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
