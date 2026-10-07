import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, Dimensions, Animated } from 'react-native';

interface BannerProps {
  banners: {
    _id?: string;
    imageUrl: string;
    targetLink?: string;
    isActive?: boolean;
  }[];
}

const { width } = Dimensions.get('window');

export default function Banner({ banners }: BannerProps) {
  const activeBanners = banners?.filter(b => b.isActive !== false) || [];
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= activeBanners.length) {
        nextIndex = 0;
      }

      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000); // Auto scroll every 3 seconds

    return () => clearInterval(interval);
  }, [currentIndex, activeBanners.length]);

  if (activeBanners.length === 0) return null;

  return (
    <View className="my-[12px]">
      <Animated.FlatList
        ref={flatListRef as any}
        data={activeBanners}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          // Sync manual swipe with our interval state
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        keyExtractor={(item, index) => item._id || index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="items-center justify-center px-[20px]" style={{ width }}>
            <View className="items-center w-full pb-[20px] relative">
              {/* Bottom Layer 3 */}
              <View className="absolute bottom-[4px] w-[80%] h-[40px] bg-primary/30 rounded-3xl z-0" />

              {/* Middle Layer 2 */}
              <View className="absolute bottom-[12px] w-[90%] h-[40px] bg-primary/60 rounded-3xl z-0" />

              {/* Main Image Layer */}
              <Image
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/800x400' }}
                className="w-full h-[140px] rounded-[32px] object-cover bg-primary/10 border-[0.5px] border-white/20 z-10"
                resizeMode="cover"
              />
            </View>
          </View>
        )}
      />

      {/* Modern 3D Expanding Pagination */}
      {activeBanners.length > 1 && (
        <View className="flex-row justify-center items-center mt-1 space-x-1.5">
          {activeBanners.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: ['#D1D5DB', '#FF8243', '#D1D5DB'], // gray-300 to primary
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i.toString()}
                style={{
                  width: dotWidth,
                  height: 6,
                  borderRadius: 4,
                  backgroundColor,
                  opacity,
                  transform: [{ scale }],
                }}
                className="mx-1"
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
