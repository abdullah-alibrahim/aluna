import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  AdminShops: undefined;
  AdminBookings: undefined;
  AdminTickets: undefined;
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
  AdminNotifications: undefined;
  AdminCategories: undefined;
  AdminSettings: undefined;
  AdminCities: undefined;
  AdminFinances: undefined;
  AdminBanners: undefined;
  AdminEditProfile: undefined;
  AdminFAQs: undefined;
  Chat: { ticketId: string; subject: string; status: string; reason: string; userId: any };
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
