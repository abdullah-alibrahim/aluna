import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchHomeData, setSelectedCity } from '@/store/slices/homeSlice';
import { fetchNotifications } from '@/store/slices/notificationSlice';
import { isStoreDemoMode, storeDemoCity } from '@/store/storeDemoData';
import { MainTabScreenProps } from '@/types/navigation';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/api/client';
import { t } from '@/i18n';

import Header from '@/components/home/Header';
import SearchBar from '@/components/home/SearchBar';
import CategoryPills from '@/components/home/CategoryPills';
import ShopCard from '@/components/home/ShopCard';
import Banner from '@/components/home/Banner';
import CitySelectionSheet from '@/components/home/CitySelectionSheet';
import { BannerSkeleton, CategorySkeleton, ShopCardSkeleton } from '@/components/home/HomeSkeletons';

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const { user, isGuest, isAuthenticated } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { categories, banners, shops, loading, selectedCity } = useAppSelector(
    (state) => state.home
  );

  const citySheetRef = useRef<BottomSheetModal>(null);
  const [activeCategoryId, setActiveCategoryId] = useState('all');

  const resolveCityId = async (preferred?: { _id: string; name: string; location?: { type?: string; coordinates: number[] } } | null) => {
    try {
      const { data: cities } = await apiClient.get('/auth/cities');
      if (!Array.isArray(cities) || cities.length === 0) return preferred?._id;

      // Rematch by name when memory DB restarted (IDs change)
      if (preferred?.name) {
        const matched = cities.find((c: any) => c.name === preferred.name);
        if (matched) {
          const geo = matched.coordinates || matched.location;
          const next = {
            _id: matched._id,
            name: matched.name,
            ...(geo?.coordinates
              ? { location: { type: geo.type || 'Point', coordinates: geo.coordinates } }
              : preferred && (preferred as any).location
                ? { location: (preferred as any).location }
                : {}),
          };
          const needsUpdate =
            matched._id !== preferred._id ||
            !(preferred as any)?.location?.coordinates;
          if (needsUpdate) {
            dispatch(setSelectedCity(next));
            await AsyncStorage.setItem('selectedCity', JSON.stringify(next));
          }
          return matched._id as string;
        }
      }

      return preferred?._id || cities[0]._id;
    } catch {
      return preferred?._id;
    }
  };

  const loadData = useCallback((cityId?: string) => {
    dispatch(fetchHomeData(cityId || selectedCity?._id));
    if (isAuthenticated && !isGuest) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated, isGuest, selectedCity?._id]);

  useEffect(() => {
    const initCity = async () => {
      try {
        if (isStoreDemoMode()) {
          dispatch(setSelectedCity(storeDemoCity));
          await AsyncStorage.setItem('selectedCity', JSON.stringify(storeDemoCity));
          loadData(storeDemoCity._id);
          return;
        }

        const storedCity = await AsyncStorage.getItem('selectedCity');
        if (storedCity) {
          const parsedCity = JSON.parse(storedCity);
          const cityId = await resolveCityId(parsedCity);
          if (!cityId || cityId === parsedCity._id) {
            dispatch(setSelectedCity(parsedCity));
          }
          loadData(cityId || parsedCity._id);
        } else {
          setTimeout(() => {
            citySheetRef.current?.present();
          }, 500);
        }
      } catch (e) {
        console.warn('Failed to load city from storage:', e);
      }
    };

    initCity();
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (selectedCity?._id) {
        dispatch(fetchHomeData(selectedCity._id));
      }
    }, [dispatch, selectedCity?._id])
  );

  const filteredShops = useMemo(() => {
    if (activeCategoryId === 'all') return shops;
    return shops.filter((shop) => shop.categoryIds?.includes(activeCategoryId));
  }, [shops, activeCategoryId]);

  const featuredShops = useMemo(() => filteredShops.slice(0, 8), [filteredShops]);
  const gridShops = useMemo(() => filteredShops.slice(0, 12), [filteredShops]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#B59451" />
        }
      >
        <Header
          user={user}
          unreadCount={Number(unreadCount || 0)}
          selectedCity={selectedCity}
          onLocationPress={() => citySheetRef.current?.present()}
        />

        <SearchBar
          onPress={() => {
            navigation.navigate('Explore');
          }}
        />

        {loading && banners.length === 0 ? (
          <BannerSkeleton />
        ) : banners.length > 0 ? (
          <Banner banners={banners} />
        ) : null}

        <View className="px-4 mt-1 mb-3 flex-row items-center justify-between">
          <Text className="text-black-main font-figtree-bold text-[16px]">
            {t('home.categories')}
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Explore')}>
            <Text className="text-primary font-figtree-medium text-[13px]">
              {t('home.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && categories.length === 0 ? (
          <CategorySkeleton />
        ) : (
          <CategoryPills
            categories={categories}
            activeId={activeCategoryId}
            onSelect={setActiveCategoryId}
          />
        )}

        {/* Zira-style horizontal browse */}
        <View className="px-4 mt-5 mb-3 flex-row items-center justify-between">
          <Text className="text-black-main font-figtree-bold text-[16px]">
            {t('home.featured')}
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Explore')}>
            <Text className="text-primary font-figtree-medium text-[13px]">
              {t('home.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && featuredShops.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <ShopCardSkeleton />
            <ShopCardSkeleton />
          </ScrollView>
        ) : featuredShops.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            decelerationRate="fast"
            snapToInterval={274}
          >
            {featuredShops.map((shop) => (
              <ShopCard key={`feat-${shop._id}`} item={shop} variant="featured" />
            ))}
          </ScrollView>
        ) : null}

        <View className="px-4 mt-4 mb-3 flex-row items-center justify-between">
          <Text className="text-black-main font-figtree-bold text-[16px]">
            {t('home.nearby')}
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Explore')}>
            <Text className="text-primary font-figtree-medium text-[13px]">
              {t('home.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 flex-row flex-wrap justify-between">
          {loading && gridShops.length === 0 ? (
            <>
              <ShopCardSkeleton />
              <ShopCardSkeleton />
              <ShopCardSkeleton />
              <ShopCardSkeleton />
            </>
          ) : gridShops.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10 w-full mt-5">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <MapPin color="#9C8C80" size={32} />
              </View>
              <Text className="text-black-main font-figtree-bold text-[16px] text-center mb-1">
                {t('home.noSalons')}
              </Text>
              <Text className="text-gray-medium font-figtree text-[14px] text-center px-6">
                {t('home.noSalonsHint')}
              </Text>
              <TouchableOpacity
                className="mt-5 bg-primary/10 px-5 py-2.5 rounded-full"
                onPress={() => {
                  setActiveCategoryId('all');
                  citySheetRef.current?.present();
                }}
              >
                <Text className="text-primary font-figtree-bold text-[14px]">
                  {t('home.changeLocation')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            gridShops.map((shop) => <ShopCard key={shop._id} item={shop} />)
          )}
        </View>
      </ScrollView>

      <CitySelectionSheet ref={citySheetRef} />
    </View>
  );
}
