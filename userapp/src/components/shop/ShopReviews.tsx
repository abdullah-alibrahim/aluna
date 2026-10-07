import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { Star } from 'lucide-react-native';
import dayjs from 'dayjs';
import apiClient from '@/api/client';
import twConfig from '../../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  comment?: string;
  photos: string[];
  createdAt: string;
}

export default function ShopReviews({ shopId }: { shopId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get(`/reviews/${shopId}`);
        setReviews(data);
      } catch (error) {
        console.error('Failed to fetch reviews', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [shopId]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />;
  }

  if (reviews.length === 0) {
    return (
      <View className="items-center justify-center mt-10">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Star size={24} color={colors.gray.medium} />
        </View>
        <Text className="font-figtree-bold text-lg text-black-main">لا تقييمات بعد</Text>
        <Text className="font-figtree-medium text-sm text-gray-medium mt-1 text-center">
          كوني أول من يقيّم بعد الموعد!
        </Text>
      </View>
    );
  }

  return (
    <View className="pb-10">
      {reviews.map((review) => (
        <View key={review._id} className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              {review.userId?.avatar ? (
                <Image 
                  source={{ uri: review.userId.avatar }} 
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Text className="font-figtree-bold text-lg text-primary">
                    {review.userId?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <View className="flex-1 pr-2">
                <Text className="font-figtree-bold text-base text-black-main" numberOfLines={1}>
                  {review.userId?.name || 'مستخدمة'}
                </Text>
                <Text className="font-figtree-medium text-xs text-gray-medium">
                  {dayjs(review.createdAt).format('MMMM D, YYYY')}
                </Text>
              </View>
            </View>
            
            <View className="bg-primary/10 flex-row items-center px-2 py-1 rounded-full">
              <Star color="#B59451" size={12} fill="#B59451" />
              <Text className="text-primary text-xs font-figtree-bold ml-1">
                {Number(review.rating || 0).toFixed(1)}
              </Text>
            </View>
          </View>
          
          {review.comment ? (
            <Text className="font-figtree-regular text-sm text-gray-dark leading-5 mb-2">
              {review.comment}
            </Text>
          ) : null}

          {review.photos && review.photos.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {review.photos.map((photo, index) => (
                <Image 
                  key={index} 
                  source={{ uri: photo }} 
                  className="w-16 h-16 rounded-xl"
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
