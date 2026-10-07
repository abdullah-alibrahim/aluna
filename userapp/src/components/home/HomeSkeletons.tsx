import React from 'react';
import { View, ScrollView } from 'react-native';
import Skeleton from '../common/Skeleton';

export const BannerSkeleton = () => {
  return (
    <View className="px-3 mt-3 mb-2">
      <Skeleton width="100%" height={160} borderRadius={16} />
    </View>
  );
};

export const CategorySkeleton = () => {
  return (
    <View className="mb-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} className="items-center mr-4 mt-2">
            <Skeleton width={60} height={60} borderRadius={30} className="mb-2" />
            <Skeleton width={48} height={12} borderRadius={4} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export const ShopCardSkeleton = () => {
  return (
    <View className="w-[48%] mb-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <Skeleton width="100%" height={120} borderRadius={0} />
      <View className="p-3">
        {/* Name */}
        <Skeleton width="80%" height={16} borderRadius={4} className="mb-2" />
        {/* Rating/Location row */}
        <View className="flex-row items-center mb-2">
          <Skeleton width={30} height={12} borderRadius={4} className="mr-2" />
          <Skeleton width={60} height={12} borderRadius={4} />
        </View>
        {/* Tags */}
        <View className="flex-row items-center">
          <Skeleton width={40} height={20} borderRadius={6} className="mr-2" />
          <Skeleton width={40} height={20} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};
