import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import LoadingScreen from '@/screens/LoadingScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMe, checkFirstLaunch } from '@/store/slices/authSlice';
import { fetchSettings } from '@/store/slices/settingSlice';
import OnboardingScreen from '@/screens/OnboardingScreen';
import ShopDetailsScreen from '@/screens/ShopDetailsScreen';
import BookingFlowScreen from '../screens/BookingFlowScreen';
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AIScreen from '../screens/AIScreen';
import AIChatScreen from '../screens/AIChatScreen';
import AIVisionScreen from '../screens/AIVisionScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FAQScreen from '../screens/FAQScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CouponsScreen from '../screens/CouponsScreen';
import VerificationScreen from '../screens/VerificationScreen';
import SupportTicketsScreen from '../screens/SupportTicketsScreen';
import CreateTicketScreen from '../screens/CreateTicketScreen';
import ChatScreen from '../screens/ChatScreen';
import RescheduleBookingScreen from '../screens/RescheduleBookingScreen';
import NotificationManager from '../utils/NotificationManager';

const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator<RootStackParamList>();

/** Defer tabs one frame after auth→app switch to avoid Fabric remount races. */
const DeferredMainTabs = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#F9F5EB' }} />;
  }
  return <BottomTabNavigator />;
};

const AuthStack = ({
  hasSeenOnboarding,
  authEntryScreen,
}: {
  hasSeenOnboarding: boolean | null;
  authEntryScreen: 'Login' | 'Register' | null;
}) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 280 }}>
    {!hasSeenOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
    {authEntryScreen === 'Register' ? (
      <>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </>
    ) : (
      <>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </>
    )}
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const AppStack = ({ needsVerification }: { needsVerification: boolean }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    {needsVerification ? (
      <Stack.Screen name="Verification" component={VerificationScreen} />
    ) : (
      <Stack.Screen name="MainTabs" component={DeferredMainTabs} />
    )}
    <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
    <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
    <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
    <Stack.Screen name="RescheduleBooking" component={RescheduleBookingScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="AIScreen" component={AIScreen} />
    <Stack.Screen name="AIChatScreen" component={AIChatScreen} />
    <Stack.Screen name="AIVisionScreen" component={AIVisionScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="Coupons" component={CouponsScreen} />
    <Stack.Screen name="Messages" component={SupportTicketsScreen} />
    <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isInitialLoading, isAuthenticated, hasSeenOnboarding, isEmailVerified, isGuest, authEntryScreen } =
    useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkFirstLaunch());
    dispatch(getMe());
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && isEmailVerified) {
      const setup = async () => {
        await NotificationManager.ensureAndroidChannel();
        const token = await NotificationManager.registerForPushNotificationsAsync();
        if (token) {
          await NotificationManager.syncTokenWithBackend(token);
        }
      };
      setup();
      const cleanup = NotificationManager.setupListeners(navigationRef);
      return () => cleanup();
    }
  }, [isAuthenticated, isEmailVerified]);

  if (isInitialLoading || hasSeenOnboarding === null) {
    return <LoadingScreen navigation={undefined as any} route={undefined as any} />;
  }

  const canBrowseApp = (isAuthenticated && isEmailVerified) || isGuest;
  const needsVerification = isAuthenticated && !isEmailVerified && !isGuest;

  if (!canBrowseApp) {
    return (
      <NavigationContainer key="auth" ref={navigationRef}>
        <AuthStack hasSeenOnboarding={hasSeenOnboarding} authEntryScreen={authEntryScreen} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer key={isGuest ? 'guest' : 'authed'} ref={navigationRef}>
      <AppStack needsVerification={needsVerification} />
    </NavigationContainer>
  );
};

export default AppNavigator;
