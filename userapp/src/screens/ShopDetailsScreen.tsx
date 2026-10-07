import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, Star, Heart, Clock } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import apiClient from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleFavoriteShop, exitGuestForAuth } from '@/store/slices/authSlice';
import { getStoreDemoShopDetails, isStoreDemoMode } from '@/store/storeDemoData';
import { t } from '@/i18n';

import ShopServices from '../components/shop/ShopServices';
import ShopStaff from '../components/shop/ShopStaff';
import ShopAbout from '../components/shop/ShopAbout';
import ShopReviews from '../components/shop/ShopReviews';
import SwipeToBook from '../components/shop/SwipeToBook';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = height * 0.35;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';

type Props = NativeStackScreenProps<RootStackParamList, 'ShopDetails'>;
type TabKey = 'services' | 'staff' | 'about' | 'reviews';

export default function ShopDetailsScreen({ route, navigation }: Props) {
  const { shop: initialShop } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user, isGuest } = useAppSelector((state) => state.auth);
  const { settings } = useAppSelector((state) => state.settings);
  const currency = settings?.currency || t('common.currency');

  const isFavorite = user?.favoriteShops?.includes(initialShop._id);

  const handleFavoritePress = () => {
    if (!user || isGuest) {
      dispatch(exitGuestForAuth('Login'));
      return;
    }
    dispatch(toggleFavoriteShop(initialShop._id));
  };

  const [shop, setShop] = useState(initialShop);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('services');

  const scrollY = useSharedValue(0);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isStoreDemoMode()) {
        const data = getStoreDemoShopDetails(initialShop._id);
        setShop(data.shop as any);
        setServices(data.services || []);
        setStaff(data.staff || []);
        setBranches(data.branches || []);
        return;
      }

      const loadById = async (id: string) => {
        const { data } = await apiClient.get(`/users/shops/${id}`);
        setShop(data.shop);
        setServices(data.services || []);
        setStaff(data.staff || []);
        setBranches(data.branches || []);
      };

      try {
        await loadById(initialShop._id);
      } catch (firstErr: any) {
        // Memory DB restart changes IDs — recover by matching shop name
        if (firstErr?.response?.status === 404 && initialShop?.name) {
          const { data: shops } = await apiClient.get('/users/shops');
          const match = (shops || []).find((s: any) => s.name === initialShop.name);
          if (match?._id) {
            await loadById(match._id);
            return;
          }
        }
        throw firstErr;
      }
    } catch (err: any) {
      if (isStoreDemoMode()) {
        const data = getStoreDemoShopDetails(initialShop._id);
        setShop(data.shop as any);
        setServices(data.services || []);
        setStaff(data.staff || []);
        setBranches(data.branches || []);
        return;
      }
      const status = err?.response?.status;
      const msg =
        status === 404
          ? 'هذا الصالون لم يعد متاحاً. ارجعي للرئيسية واسحبي للتحديث.'
          : 'فشل تحميل تفاصيل الصالون';
      console.error('Failed to load shop details', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [initialShop._id]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-HEADER_MAX_HEIGHT, 0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [-HEADER_MAX_HEIGHT / 2, 0, -(HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT)],
      Extrapolation.CLAMP
    );

    const scale = interpolate(scrollY.value, [-HEADER_MAX_HEIGHT, 0], [2, 1], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }, { scale }] as any,
    };
  });

  const headerTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT - 30, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = shop?.operatingHours?.find((h: any) => h.day === todayDayName);
  const isOpen = todayHours && !todayHours.isClosed;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'services', label: 'الخدمات' },
    { key: 'staff', label: 'المختصون' },
    { key: 'about', label: 'عن الصالون' },
    { key: 'reviews', label: 'التقييمات' },
  ];

  const imageUri = shop?.images?.[0] || FALLBACK_IMAGE;

  return (
    <View className="flex-1 bg-background">
      <Animated.View style={[styles.header, { height: HEADER_MAX_HEIGHT }, headerAnimatedStyle]}>
        <Image source={{ uri: imageUri }} style={styles.headerImage} />
        <LinearGradient
          colors={['transparent', 'rgba(248, 239, 234, 0.6)', '#F9F5EB']}
          locations={[0.5, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={[styles.headerActions, { paddingTop: insets.top || 20 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full items-center justify-center bg-black/35"
        >
          <ArrowLeft color="#FFFFFF" size={22} />
        </TouchableOpacity>

        <Animated.View style={[headerTitleAnimatedStyle, { flex: 1, alignItems: 'center' }]}>
          <Text className="text-black-main font-figtree-bold text-lg" numberOfLines={1}>
            {shop?.name}
          </Text>
        </Animated.View>

        <TouchableOpacity
          onPress={handleFavoritePress}
          className="w-10 h-10 rounded-full items-center justify-center bg-black/35"
        >
          <Heart
            color={isFavorite ? '#B59451' : '#FFFFFF'}
            size={22}
            strokeWidth={2}
            fill={isFavorite ? '#B59451' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT, paddingBottom: 100 }}
      >
        <View
          className="bg-white rounded-t-[32px] mt-[-32px]"
          style={{ minHeight: height - HEADER_MAX_HEIGHT + 32 }}
        >
          <View className="px-5 pt-6 pb-4 mb-0">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-black-main font-figtree-bold text-2xl flex-1 pr-3 leading-8">
                {shop?.name}
              </Text>
              <View className="bg-primary/10 flex-row items-center px-2.5 py-1.5 rounded-full">
                <Star color="#B59451" size={14} fill="#B59451" />
                <Text className="text-primary text-[13px] font-figtree-bold ml-1">
                  {Number(shop?.rating || 0).toFixed(1)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-2">
              <MapPin color="#9C8C80" size={16} />
              <Text className="text-gray-medium font-figtree-medium text-sm ml-1 flex-1" numberOfLines={2}>
                {shop?.address || (shop?.cityId as any)?.name}
              </Text>
            </View>

            {branches.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-2">
                {branches.map((b) => (
                  <View key={b._id} className="bg-background border border-gray-lighter px-3 py-1.5 rounded-full">
                    <Text className="font-figtree-bold text-[11px] text-black-main">
                      {b.name}{b.isMain ? ' · رئيسي' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-lighter">
              <View className="flex-row items-center">
                <Clock color="#9C8C80" size={16} />
                <Text className="text-gray-medium font-figtree-medium text-sm ml-1.5">
                  <Text className={isOpen ? 'text-primary font-figtree-bold' : 'text-error font-figtree-bold'}>
                    {isOpen ? 'مفتوح الآن' : 'مغلق'}
                  </Text>
                  {isOpen ? ` • يغلق ${todayHours?.close}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {error ? (
            <View className="px-5 py-10 items-center">
              <Text className="font-figtree-bold text-base text-black-main text-center mb-2">
                تعذّر فتح الصالون
              </Text>
              <Text className="font-figtree-medium text-sm text-gray-medium text-center mb-6 leading-5">
                {error}
              </Text>
              <TouchableOpacity
                onPress={fetchDetails}
                className="bg-primary px-6 py-3 rounded-full mb-3"
              >
                <Text className="font-figtree-bold text-white">إعادة المحاولة</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} className="px-6 py-3">
                <Text className="font-figtree-bold text-primary">العودة للرئيسية</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="flex-row mx-3 mb-3 bg-gray-100 rounded-full p-1">
                {TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                    className={`flex-1 py-2.5 items-center justify-center rounded-full ${
                      activeTab === tab.key ? 'bg-white' : ''
                    }`}
                  >
                    <Text
                      className={`font-figtree-bold text-[12px] ${
                        activeTab === tab.key ? 'text-black-main' : 'text-gray-medium'
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="px-5">
                {loading ? (
                  <ActivityIndicator color="#B59451" size="large" style={{ marginTop: 40 }} />
                ) : (
                  <>
                    {activeTab === 'services' && (
                      <ShopServices services={services} currency={currency} />
                    )}
                    {activeTab === 'staff' && <ShopStaff staff={staff} />}
                    {activeTab === 'about' && <ShopAbout shop={shop} />}
                    {activeTab === 'reviews' && <ShopReviews shopId={shop._id} />}
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>

      {!error && (
        <View style={[styles.floatingBottomBar, { paddingBottom: insets.bottom || 20 }]}>
          {isStoreDemoMode() ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BookingFlow', { shop })}
              className="mx-5 h-14 rounded-full bg-black-main items-center justify-center"
            >
              <Text className="font-figtree-bold text-white text-base">احجزي الآن</Text>
            </TouchableOpacity>
          ) : (
            <SwipeToBook
              onBook={() => {
                if (!user || isGuest) {
                  dispatch(exitGuestForAuth('Login'));
                  return;
                }
                navigation.navigate('BookingFlow', { shop });
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
