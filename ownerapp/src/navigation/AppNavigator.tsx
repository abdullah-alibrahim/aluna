import React, { useState, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import LoadingScreen from '@/screens/LoadingScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import VerificationScreen from '@/screens/VerificationScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMe, checkFirstLaunch } from '@/store/slices/authSlice';
import OnboardingScreen from '@/screens/OnboardingScreen';
import CreateShopScreen from '@/screens/CreateShopScreen';
import ShopDetailsScreen from '@/screens/ShopDetailsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import EditShopScreen from '@/screens/EditShopScreen';
import ManageServicesScreen from '@/screens/ManageServicesScreen';
import ManageStaffScreen from '@/screens/ManageStaffScreen';
import ManageCouponsScreen from '@/screens/ManageCouponsScreen';
import ManageBranchesScreen from '@/screens/ManageBranchesScreen';
import PosScreen from '@/screens/PosScreen';
import ChatScreen from '@/screens/ChatScreen';
import CreateTicketScreen from '@/screens/CreateTicketScreen';
import OwnerWalletScreen from '@/screens/OwnerWalletScreen';
import OwnerEditProfileScreen from '../screens/OwnerEditProfileScreen';
import OwnerFAQScreen from '../screens/OwnerFAQScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationManager from '../utils/NotificationManager';

const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isInitialLoading, isAuthenticated, hasSeenOnboarding, isEmailVerified } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkFirstLaunch());
    dispatch(getMe());
  }, [dispatch]);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && isEmailVerified) {
      const setup = async () => {
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

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 280,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Group>
            {!hasSeenOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </Stack.Group>
        ) : !isEmailVerified ? (
          <Stack.Group>
            <Stack.Screen name="Verification" component={VerificationScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen name="CreateShop" component={CreateShopScreen} />
            <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="EditShop" component={EditShopScreen} />
            <Stack.Screen name="ManageServices" component={ManageServicesScreen} />
            <Stack.Screen name="ManageStaff" component={ManageStaffScreen} />
            <Stack.Screen name="ManageCoupons" component={ManageCouponsScreen} />
            <Stack.Screen name="ManageBranches" component={ManageBranchesScreen} />
            <Stack.Screen name="Pos" component={PosScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
            <Stack.Screen name="OwnerWallet" component={OwnerWalletScreen} />
            <Stack.Screen name="OwnerEditProfile" component={OwnerEditProfileScreen} />
            <Stack.Screen name="OwnerFAQs" component={OwnerFAQScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
      {/* Forced Fast Refresh */}
    </NavigationContainer>
  );
};

export default AppNavigator;
