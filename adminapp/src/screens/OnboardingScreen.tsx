import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/store/hooks';
import { setOnboardingComplete } from '@/store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'ألونا للإدارة',
    description: 'تحكّم بالمنصة في سوريا: الصالونات، المدن، والمدفوعات.',
    image: require('../../assets/logo.png'),
  },
  {
    id: '2',
    title: 'موافقات ومتابعة',
    description: 'وافق على الصالونات، راجع السحوبات، وأدر تذاكر الدعم.',
    image: require('../../assets/logo.png'),
  },
  {
    id: '3',
    title: 'إعدادات المنصة',
    description: 'اضبط العملة (ل.س)، العمولة، والمدن السورية بسهولة.',
    image: require('../../assets/logo.png'),
  },
];

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
      <Image source={item.image} style={{ width: 220, height: 220 }} resizeMode="contain" />
      <Text className="text-black-main font-figtree-bold text-3xl text-center mt-8 mb-3">{item.title}</Text>
      <Text className="text-gray-medium font-figtree text-base text-center leading-6">{item.description}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9F5EB' }}>
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
            <View
              key={i}
              style={{
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: '#B59451',
                width: i === currentIndex ? 24 : 8,
                opacity: i === currentIndex ? 1 : 0.45,
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={nextSlide}
          activeOpacity={0.85}
          className="bg-primary h-14 rounded-full flex-row items-center justify-center"
          style={{ backgroundColor: '#B59451' }}
        >
          <Text className="text-white font-figtree-bold text-lg ml-2" style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
            {currentIndex === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </Text>
          <ChevronLeft size={20} color="#fff" style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen;
