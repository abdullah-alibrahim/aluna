import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { Shop } from '@/store/slices/shopSlice';

export type MainTabParamList = {
  Home: undefined;
  Explore: { categoryId?: string; autoFocusSearch?: boolean };
  Messages: undefined;
  Bookings: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Verification: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Loading: undefined;
  Coupons: undefined;
  Messages: undefined;
  Tickets: undefined;
  Chat: { ticketId: string; subject: string };
  CreateTicket: undefined;
  ShopDetails: { shop: Shop };
  Notifications: undefined;
  BookingFlow: { shop: Shop };
  BookingSuccess: { bookingId: string };
  RescheduleBooking: { booking: any };
  AIScreen: undefined;
  AIChatScreen: undefined;
  AIVisionScreen: undefined;
  EditProfile: undefined;
  FAQ: undefined;
  ChangePassword: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
