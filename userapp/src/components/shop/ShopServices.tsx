import React from 'react';
import { View, Text, Image } from 'react-native';
import { formatMoney } from '@/utils/helper';

export default function ShopServices({
  services,
  currency = 'ل.س',
}: {
  services: any[];
  currency?: string;
}) {
  if (!services || services.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-light font-figtree">لا توجد خدمات حالياً</Text>
      </View>
    );
  }

  return (
    <View className="pb-5">
      {services.map((service, index) => (
        <View 
          key={service._id || index}
          className="flex-row items-center bg-white py-4 mb-2 border-b border-gray-lighter/50"
        >
          {service.image ? (
            <Image 
              source={{ uri: service.image }} 
              className="w-16 h-16 rounded-2xl mr-4 bg-gray-100"
            />
          ) : (
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Text className="text-primary font-figtree-bold text-lg">
                {service.name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>
          )}
          
          <View className="flex-1">
            <Text className="text-black-main font-figtree-bold text-base mb-1">{service.name}</Text>
            {!!service.description && service.description !== service.name && (
              <Text className="text-gray-medium font-figtree text-xs" numberOfLines={2}>
                {service.description}
              </Text>
            )}
            <Text className="text-primary font-figtree-bold text-sm mt-1">
              {formatMoney(service.price, currency)}{' '}
              <Text className="text-gray-light font-figtree text-xs">• {service.duration} د</Text>
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
