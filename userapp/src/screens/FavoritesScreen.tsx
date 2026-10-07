import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Search } from 'lucide-react-native';
import apiClient from '@/api/client';
import ShopCard from '@/components/home/ShopCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { t } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { exitGuestForAuth } from '@/store/slices/authSlice';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { isGuest, isAuthenticated } = useAppSelector((state) => state.auth);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    if (isGuest || !isAuthenticated) {
      setFavorites([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await apiClient.get('/users/favorites');
      setFavorites(response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401) {
        console.warn('Favorites fetch failed', status || error?.message);
      }
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [isGuest, isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const renderEmptyState = () => {
    if (loading) return null;
    if (isGuest || !isAuthenticated) {
      return (
        <View className="flex-1 items-center justify-center mt-20 px-3">
          <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-6 shadow-lg shadow-black/5">
            <Heart color="#D1C9C0" size={56} strokeWidth={1.5} />
          </View>
          <Text className="text-2xl font-figtree-bold text-black-main mb-3 text-center">
            سجّلي الدخول للمفضلة
          </Text>
          <Text className="text-base font-figtree text-gray-medium text-center leading-relaxed mb-8">
            احفظي صالوناتك المفضلة بعد تسجيل الدخول.
          </Text>
          <TouchableOpacity
            onPress={() => dispatch(exitGuestForAuth('Login'))}
            className="bg-primary px-8 py-4 rounded-full"
          >
            <Text className="text-white font-figtree-bold text-base">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center mt-20 px-3">
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-6 shadow-lg shadow-black/5">
          <Heart color="#D1C9C0" size={56} strokeWidth={1.5} />
        </View>
        <Text className="text-2xl font-figtree-bold text-black-main mb-3 text-center">
          {t('favorites.emptyTitle')}
        </Text>
        <Text className="text-base font-figtree text-gray-medium text-center leading-relaxed mb-8">
          {t('favorites.emptyHint')}
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Explore' as any)}
          className="bg-black-main px-8 py-4 rounded-full flex-row items-center shadow-lg shadow-black/20"
        >
          <Search color="#FFFFFF" size={20} className="mr-2" />
          <Text className="text-white font-figtree-bold text-base">{t('favorites.exploreSalons')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-3 pt-3 pb-2">
        <Text className="text-3xl font-figtree-bold text-black-main tracking-tight">{t('favorites.title')}</Text>
        <Text className="text-sm font-figtree text-gray-medium mt-1">{t('favorites.subtitle')}</Text>
      </View>

      {/* Main Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8243" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={{ 
            paddingHorizontal: 12, 
            paddingTop: 12,
            paddingBottom: insets.bottom + 100 // Extra padding for bottom tab
          }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => <ShopCard item={item} />}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8243" />
          }
        />
      )}
    </View>
  );
}
