import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/types/navigation';
import { ArrowLeft, Search, SlidersHorizontal, MapPin } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchExploreShops, setExploreFilters } from '@/store/slices/exploreSlice';
import ShopCard from '@/components/home/ShopCard';
import FilterSheet from '@/components/explore/FilterSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { t } from '@/i18n';

type ExploreScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Explore'>;

/** City GeoJSON is [lng, lat] on either `location` or `coordinates`. */
function getCityLatLng(city: any): { latitude?: number; longitude?: number } {
  const coords =
    city?.location?.coordinates ||
    city?.coordinates?.coordinates ||
    city?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return {};
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return {};
  return { latitude, longitude };
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExploreScreenNavigationProp>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  
  const { categories, selectedCity } = useAppSelector((state) => state.home);
  const { shops, loading, error, filters } = useAppSelector((state) => state.explore);
  
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const [searchInput, setSearchInput] = useState('');
  const cityCoords = getCityLatLng(selectedCity);
  
  useEffect(() => {
    if (route.params?.categoryId) {
      dispatch(setExploreFilters({ categoryId: route.params.categoryId }));
    }
  }, [route.params?.categoryId]);

  useEffect(() => {
    dispatch(fetchExploreShops({
      ...filters,
      cityId: selectedCity?._id,
      ...cityCoords,
    }));
  }, [filters, selectedCity, cityCoords.latitude, cityCoords.longitude]);

  const handleSearch = () => {
    dispatch(setExploreFilters({ searchQuery: searchInput }));
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center pt-20 px-6">
      <View className="w-32 h-32 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5 mb-6">
        <MapPin size={48} color="#D1D5DB" />
      </View>
      <Text className="font-figtree-bold text-2xl text-black-main text-center mb-2">
        {t('explore.emptyTitle')}
      </Text>
      <Text className="font-figtree-regular text-base text-gray-medium text-center leading-6">
        {t('explore.emptyHint')}
      </Text>
      <TouchableOpacity 
        onPress={() => {
          setSearchInput('');
          dispatch(setExploreFilters({ categoryId: 'all', searchQuery: '', minRating: undefined, minPrice: undefined, maxPrice: undefined }));
        }}
        className="mt-8 bg-primary/10 px-6 py-3 rounded-full"
      >
        <Text className="font-figtree-bold text-primary text-base">{t('explore.clearFilters')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-3 py-3 flex-row items-center justify-between">
        {navigation.canGoBack() ? (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
          >
            <ArrowLeft size={20} color="#14110A" />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10" />
        )}
        <Text className="font-figtree-bold text-lg text-black-main">{t('explore.title')}</Text>
        <View className="w-10 h-10" />
      </View>

      <View className="px-3 mb-4 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-lighter rounded-2xl px-3 py-2.5 shadow-sm shadow-black/5">
          <Search size={20} color="#9C8C80" />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor="#9C8C80"
            className="flex-1 ml-2 font-figtree-medium text-base text-black-main p-0"
            returnKeyType="search"
            textAlign="right"
          />
        </View>
        <TouchableOpacity 
          onPress={() => filterSheetRef.current?.present()}
          className="w-10 h-10 rounded-2xl bg-black-main items-center justify-center shadow-md shadow-black/20"
        >
          <SlidersHorizontal size={20} color="#FFFFFF" />
          {(filters.minRating || filters.minPrice || filters.maxPrice || filters.distance !== 10000 || filters.sortBy !== 'featured') && (
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border border-black-main" />
          )}
        </TouchableOpacity>
      </View>

      <View className="mb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          data={[{ _id: 'all', name: t('explore.all') }, ...categories]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isActive = filters.categoryId === item._id || (!filters.categoryId && item._id === 'all');
            return (
              <TouchableOpacity
                onPress={() => dispatch(setExploreFilters({ categoryId: item._id === 'all' ? undefined : item._id }))}
                className={`px-5 py-2 rounded-full border ${
                  isActive ? 'bg-primary border-primary' : 'bg-white border-gray-lighter'
                }`}
              >
                <Text className={`font-figtree-bold text-sm ${isActive ? 'text-white' : 'text-gray-medium'}`}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading && shops.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#B59451" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="font-figtree-medium text-error text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() =>
              dispatch(
                fetchExploreShops({
                  ...filters,
                  cityId: selectedCity?._id,
                  ...getCityLatLng(selectedCity),
                })
              )
            }
            className="bg-primary px-6 py-3 rounded-full"
          >
            <Text className="font-figtree-bold text-white">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => <ShopCard item={item} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
        />
      )}

      <FilterSheet ref={filterSheetRef} onApply={() => filterSheetRef.current?.dismiss()} />
    </View>
  );
}
