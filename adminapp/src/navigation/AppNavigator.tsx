import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import LoadingScreen from '@/screens/LoadingScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMe, checkFirstLaunch } from '@/store/slices/authSlice';
import OnboardingScreen from '@/screens/OnboardingScreen';
import VerificationScreen from '@/screens/VerificationScreen';
import AdminNotificationScreen from '@/screens/AdminNotificationScreen';
import AdminCategoriesScreen from '@/screens/AdminCategoriesScreen';
import AdminSettingsScreen from '@/screens/AdminSettingsScreen';
import AdminCitiesScreen from '@/screens/AdminCitiesScreen';
import AdminFinancesScreen from '@/screens/AdminFinancesScreen';
import AdminBannersScreen from '@/screens/AdminBannersScreen';
import AdminEditProfileScreen from '@/screens/AdminEditProfileScreen';
import AdminFAQScreen from '@/screens/AdminFAQScreen';
import ChatScreen from '@/screens/ChatScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isInitialLoading, isAuthenticated, hasSeenOnboarding, isEmailVerified } = useAppSelector((state) => state.auth);
  const [bootTimedOut, setBootTimedOut] = useState(false);

  useEffect(() => {
    dispatch(checkFirstLaunch());
    dispatch(getMe());
    const t = setTimeout(() => setBootTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [dispatch]);

  const stillBooting = (isInitialLoading || hasSeenOnboarding === null) && !bootTimedOut;

  if (stillBooting) {
    return <LoadingScreen />;
  }

  const seenOnboarding = hasSeenOnboarding === true;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#F9F5EB' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Group>
            {!seenOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
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
            <Stack.Screen name="AdminNotifications" component={AdminNotificationScreen} />
            <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
            <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
            <Stack.Screen name="AdminCities" component={AdminCitiesScreen} />
            <Stack.Screen name="AdminFinances" component={AdminFinancesScreen} />
            <Stack.Screen name="AdminBanners" component={AdminBannersScreen} />
            <Stack.Screen name="AdminEditProfile" component={AdminEditProfileScreen} />
            <Stack.Screen name="AdminFAQs" component={AdminFAQScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
