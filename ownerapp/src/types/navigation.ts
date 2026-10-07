import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { Shop } from '@/store/slices/shopSlice';

export type MainTabParamList = {
  Home: undefined;
  MyShops: undefined;
  Messages: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Verification: undefined;
  ForgotPassword: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Loading: undefined;
  AdminNotifications: undefined;
  AdminCategories: undefined;
  AdminSettings: undefined;
  AdminCities: undefined;
  OwnerWallet: undefined;
  AdminBanners: undefined;
  OwnerEditProfile: undefined;
  OwnerFAQs: undefined;
  ChangePassword: undefined;
  AdminFAQs: undefined;
  Messages: undefined;
  Chat: { ticketId: string; subject: string };
  CreateTicket: undefined;
  CreateShop: undefined;
  ShopDetails: { shop: Shop };
  EditShop: { shop: Shop };
  ManageServices: { shop: any };
  ManageStaff: { shop: any };
  ManageCoupons: { shop: any };
  ManageBranches: { shop: any };
  Pos: { shop: any };
  Notifications: undefined;
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
