import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Dimensions, 
  TouchableOpacity, 
  Image,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/store/hooks';
import { setOnboardingComplete } from '@/store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'مرحباً بك في ألونا',
    description: 'اكتشف أفضل الصالونات ومراكز التجميل في سوريا واحجز موعدك فوراً.',
    image: require('../../assets/logo.png'), 
  },
  {
    id: '2',
    title: 'حجز سهل وسريع',
    description: 'اختر المختص والوقت المناسب، وتابع مواعيدك من مكان واحد.',
    image: require('../../assets/logo.png'), 
  },
  {
    id: '3',
    title: 'دفع مرن',
    description: 'ادفع إلكترونياً من التطبيق أو نقداً عند الوصول للصالون.',
    image: require('../../assets/logo.png'), 
  }
];

const Dot = ({ active }: { active: boolean }) => {
  const w = useSharedValue(active ? 24 : 8);
  const opacity = useSharedValue(active ? 1 : 0.45);

  useEffect(() => {
    w.value = withSpring(active ? 24 : 8, { damping: 14, stiffness: 160 });
    opacity.value = withTiming(active ? 1 : 0.45, { duration: 220 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: w.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ height: 8, borderRadius: 4, backgroundColor: '#B59451', marginHorizontal: 4 }, style]}
    />
  );
};

const OnboardingScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      dispatch(setOnboardingComplete());
    } catch (err) {
      console.warn('Failed to save onboarding status', err);
      dispatch(setOnboardingComplete());
    }
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = ({ item }: any) => (
    <View style={{ width }} className="items-center justify-center px-8">
      <Animated.View entering={FadeInDown.duration(500).springify().damping(16)}>
        <Image source={item.image} style={{ width: 220, height: 220 }} resizeMode="contain" />
      </Animated.View>
      <Text className="text-black-main font-figtree-bold text-3xl text-center mt-8 mb-3">{item.title}</Text>
      <Text className="text-gray-medium font-figtree text-base text-center leading-6">{item.description}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row justify-end px-6 pt-2">
        <TouchableOpacity onPress={completeOnboarding}>
          <Text className="text-primary font-figtree-bold text-base">تخطي</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View className="px-8 pb-8">
        <View className="flex-row justify-center mb-6 items-center">
          {slides.map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </View>

        <TouchableOpacity
          onPress={nextSlide}
          activeOpacity={0.85}
          className="bg-primary h-14 rounded-full flex-row items-center justify-center shadow-sm"
          style={{ shadowColor: '#B59451', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
        >
          <Text className="text-white font-figtree-bold text-lg ml-2">
            {currentIndex === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </Text>
          <ChevronLeft
            size={20}
            color="#fff"
            style={{ transform: [{ scaleX: I18nManager.isRTL ? 1 : -1 }] }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen;
