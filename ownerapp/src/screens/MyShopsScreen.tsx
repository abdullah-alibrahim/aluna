import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  Store, 
  MapPin, 
  Plus,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Ban
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyShops, Shop } from '@/store/slices/shopSlice';
import { getShopApprovalLabel, isShopRejected } from '@/utils/shopStatus';
import twConfig from '../../tailwind.config.js';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

const colors = twConfig.theme.extend.colors;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MyShopsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const { myShops, loading } = useAppSelector(state => state.shops);

  useEffect(() => {
    dispatch(fetchMyShops());
  }, [dispatch]);

  const renderStatusBadge = (shop: Shop) => {
    if (isShopRejected(shop)) {
      return (
        <View className="bg-error-light px-3 py-1.5 rounded-full flex-row items-center border border-error/20">
          <Ban size={12} color={colors.error.DEFAULT} className="mr-1" />
          <Text className="font-figtree-bold text-[10px] uppercase tracking-wider text-error">مرفوض</Text>
        </View>
      );
    }
    if (!shop.isApproved) {
      return (
        <View className="bg-warning-light px-3 py-1.5 rounded-full flex-row items-center border border-warning/20">
          <ShieldAlert size={12} color={colors.warning.DEFAULT} className="mr-1" />
          <Text className="font-figtree-bold text-[10px] uppercase tracking-wider text-warning">{getShopApprovalLabel(shop)}</Text>
        </View>
      );
    }
    if (!shop.isActive) {
      return (
        <View className="bg-error-light px-3 py-1.5 rounded-full flex-row items-center border border-error/20">
          <Ban size={12} color={colors.error.DEFAULT} className="mr-1" />
          <Text className="font-figtree-bold text-[10px] uppercase tracking-wider text-error">غير نشط</Text>
        </View>
      );
    }
    return (
      <View className="bg-success-light gap-1 px-3 py-1.5 rounded-full flex-row items-center border border-success/20">
        <ShieldCheck size={12} color={colors.success.DEFAULT} className="mr-1" />
        <Text className="font-figtree-bold text-[10px] uppercase tracking-wider text-success">نشط</Text>
      </View>
    );
  };

  const renderShopCard = ({ item }: { item: Shop }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ShopDetails', { shop: item })}
      activeOpacity={0.8}
      className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="flex-row items-start mb-3">
        <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mr-4">
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} className="w-full h-full rounded-2xl" />
          ) : (
            <Store size={28} color={colors.primary} />
          )}
        </View>
        <View className="flex-1 mt-1">
          <Text className="font-figtree-bold text-lg text-black-main mb-1" numberOfLines={1}>{item.name}</Text>
          <View className="flex-row gap-1 items-center mb-2">
            <MapPin size={12} color={colors.gray.light} className="mr-1" />
            <Text className="font-figtree-regular text-xs text-gray-medium" numberOfLines={1}>
              {typeof item.cityId === 'object' ? item.cityId.name : 'Location'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-lighter">
        {renderStatusBadge(item)}
        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full">
          <Text className="font-figtree-bold text-xs text-primary mr-1">عرض التفاصيل</Text>
          <ChevronRight size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-4 bg-background z-10">
        <Text className="font-figtree-bold text-2xl text-black-main">صالوناتي</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateShop')}
          className="bg-primary flex-row items-center px-3 py-2 rounded-full shadow-sm shadow-primary/30"
        >
          <Plus size={16} color="#FFF" className="mr-1" />
          <Text className="font-figtree-bold text-white text-sm">إضافة جديد</Text>
        </TouchableOpacity>
      </View>

      {loading && myShops.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={myShops}
          keyExtractor={(item) => item._id}
          renderItem={renderShopCard}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-32 px-6">
              <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
                <Store size={40} color={colors.primary} />
              </View>
              <Text className="font-figtree-bold text-2xl text-black-main text-center mb-2">لا توجد صالونات بعد</Text>
              <Text className="font-figtree-regular text-sm text-gray-medium text-center mb-8">
                لم تسجّلي أي صالون بعد. سجّلي صالونك الأول لبدء استقبال الحجوزات.
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('CreateShop')}
                className="bg-primary w-full py-4 rounded-2xl items-center shadow-lg shadow-primary/30"
              >
                <Text className="font-figtree-bold text-white text-lg">تسجيل صالون</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

    </View>
  );
};

export default MyShopsScreen;
