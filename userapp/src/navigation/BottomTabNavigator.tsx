import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, Calendar, Search, Heart } from 'lucide-react-native';
import { MainTabParamList } from '../types/navigation';
import { t } from '@/i18n';

import HomeScreen from '@/screens/HomeScreen';
import ExploreScreen from '@/screens/ExploreScreen';
import UserBookingsScreen from '@/screens/UserBookingsScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 20,
        left: 20,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 50,
          overflow: 'hidden',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: 'rgba(28, 26, 23, 0.92)',
          width: '90%',
          maxWidth: 400,
          borderWidth: 1,
          borderColor: 'rgba(248, 239, 234, 0.3)',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const Icon = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              className={`items-center justify-center rounded-full ${isFocused ? 'bg-primary' : 'bg-transparent'} w-[42px] h-[42px]`}
              activeOpacity={0.7}
            >
              {Icon
                ? Icon({
                    focused: isFocused,
                    color: isFocused ? '#14110A' : '#FFFFFF',
                    size: 24,
                  })
                : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id="BottomTabs"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Home color={color} size={size} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: t('tabs.explore'),
          tabBarAccessibilityLabel: t('tabs.explore'),
          tabBarIcon: ({ color, size, focused }) => (
            <Search color={color} size={size} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={UserBookingsScreen}
        options={{
          title: t('tabs.bookings'),
          tabBarAccessibilityLabel: t('tabs.bookings'),
          tabBarIcon: ({ color, size, focused }) => (
            <Calendar color={color} size={size} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: t('tabs.favorites'),
          tabBarAccessibilityLabel: t('tabs.favorites'),
          tabBarIcon: ({ color, size, focused }) => (
            <Heart color={color} size={size} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('tabs.profile'),
          tabBarAccessibilityLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <User color={color} size={size} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
