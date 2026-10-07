import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { MapPin, Star, Heart } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleFavoriteShop, exitGuestForAuth } from '@/store/slices/authSlice';
import { t } from '@/i18n';

type Props = {
  item: any;
  onPress?: () => void;
  /** Zira-style wide horizontal card */
  variant?: 'grid' | 'featured';
};

export default function ShopCard({ item, onPress, variant = 'grid' }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { user, isGuest } = useAppSelector((state) => state.auth);

  const scale = useSharedValue(1);
  const isFavorite = user?.favoriteShops?.includes(item?._id);
  const isFeatured = variant === 'featured';

  const handleFavoritePress = () => {
    if (!user || isGuest) {
      dispatch(exitGuestForAuth('Login'));
      return;
    }
    dispatch(toggleFavoriteShop(item._id));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = item?.operatingHours?.find((h: any) => h.day === todayDayName);
  const isOpen = todayHours && !todayHours.isClosed;

  const locationText = item?.distance != null && Number.isFinite(Number(item.distance))
    ? `${(Number(item.distance) / 1000).toFixed(1)} كم`
    : item?.cityId?.name || item?.address || '';

  const imageUri =
    item?.images?.[0] ||
    item?.image ||
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';

  const openDetails = () => {
    if (onPress) onPress();
    navigation.navigate('ShopDetails', { shop: item });
  };

  if (isFeatured) {
    return (
      <Animated.View style={[animatedStyle, { width: 260, marginRight: 14 }]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={openDetails}
        >
          <View
            className="bg-white rounded-[22px] overflow-hidden border border-gray-lighter"
            style={{
              shadowColor: '#1C1812',
              shadowOpacity: 0.08,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
          >
            <ImageBackground
              source={{ uri: imageUri }}
              className="w-full h-[150px] justify-between p-2.5"
            >
              <View className="flex-row justify-between items-start">
                <View className="bg-black-main/70 flex-row items-center px-2 py-1 rounded-full">
                  <Star color="#B59451" size={12} fill="#B59451" />
                  <Text className="text-white text-[11px] font-figtree-bold ml-1">
                    {Number(item?.rating || 0).toFixed(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleFavoritePress}
                  activeOpacity={0.7}
                  className="w-8 h-8 rounded-full bg-black/25 items-center justify-center"
                >
                  <Heart
                    color={isFavorite ? '#B59451' : '#FFFFFF'}
                    size={16}
                    fill={isFavorite ? '#B59451' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              <View
                className={`self-start px-2.5 py-1 rounded-full ${
                  isOpen ? 'bg-primary' : 'bg-black/50'
                }`}
              >
                <Text className="text-white text-[10px] font-figtree-bold">
                  {isOpen ? t('home.openNow') : t('home.closed')}
                </Text>
              </View>
            </ImageBackground>

            <View className="p-3.5">
              <Text className="text-black-main font-figtree-bold text-[16px] mb-1" numberOfLines={1}>
                {item?.name || ''}
              </Text>
              <View className="flex-row items-center mb-3">
                <MapPin color="#706256" size={13} strokeWidth={2.5} />
                <Text
                  className="text-gray-medium font-figtree-medium text-[12px] mr-1 flex-1 text-right"
                  numberOfLines={1}
                >
                  {locationText}
                </Text>
              </View>
              <View className="bg-primary/10 rounded-xl py-2.5 items-center">
                <Text className="text-primary font-figtree-bold text-[13px]">
                  {t('home.bookNow')}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, { width: '48%', marginBottom: 12 }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={openDetails}
      >
        <View className="bg-white rounded-[20px] border border-gray-lighter overflow-hidden">
          <ImageBackground
            source={{ uri: imageUri }}
            className="w-full h-[140px] justify-between p-2"
          >
            <View className="flex-row justify-between items-start">
              <View className="bg-black-main/70 flex-row items-center px-2 py-1 rounded-full">
                <Star color="#B59451" size={12} fill="#B59451" />
                <Text className="text-white text-[11px] font-figtree-bold ml-1">
                  {Number(item?.rating || 0).toFixed(1)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleFavoritePress}
                activeOpacity={0.7}
                className="p-1 w-8 h-8 rounded-full bg-black/20 items-center justify-center"
              >
                <Heart
                  color={isFavorite ? '#B59451' : '#FFFFFF'}
                  size={18}
                  strokeWidth={2}
                  fill={isFavorite ? '#B59451' : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <View className="p-3">
            <Text
              className={`font-figtree-bold text-[10px] mb-1 ${
                isOpen ? 'text-primary' : 'text-error'
              }`}
            >
              {isOpen ? t('home.openNow') : t('home.closed')}
            </Text>
            <Text className="text-black-main font-figtree-bold text-[14px] mb-1.5" numberOfLines={1}>
              {item?.name || ''}
            </Text>
            <View className="flex-row items-center mb-2">
              <MapPin color="#706256" size={12} strokeWidth={2.5} />
              <Text
                className="text-gray-medium font-figtree-medium text-[11px] mr-1 flex-1 text-right"
                numberOfLines={1}
              >
                {locationText}
              </Text>
            </View>
            <View className="border-t border-gray-lighter pt-2 items-center">
              <Text className="text-primary font-figtree-bold text-[13px]">{t('home.bookNow')}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
