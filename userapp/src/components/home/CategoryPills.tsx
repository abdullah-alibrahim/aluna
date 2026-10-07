import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, Image } from 'react-native';
import { t } from '@/i18n';

export default function CategoryPills({ categories = [], activeId, onSelect }: any) {
  const allCats = [{ _id: 'all', name: t('home.all') }, ...categories];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 10 }}
    >
      {allCats.map((cat) => {
        const isActive = activeId === cat._id;
        return (
          <TouchableOpacity
            key={cat._id}
            onPress={() => onSelect(cat._id)}
            activeOpacity={0.85}
            className={`items-center mr-1 ${isActive ? '' : ''}`}
            style={{ width: 72 }}
          >
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mb-1.5 border ${
                isActive
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-lighter'
              }`}
            >
              {cat.image ? (
                <Image
                  source={{ uri: cat.image }}
                  className="w-7 h-7"
                  resizeMode="contain"
                  style={isActive ? { tintColor: '#FFFFFF' } : undefined}
                />
              ) : (
                <Text
                  className={`font-figtree-bold text-lg ${
                    isActive ? 'text-white' : 'text-primary'
                  }`}
                >
                  {String(cat.name || '?').charAt(0)}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              className={`font-figtree-medium text-[11px] text-center ${
                isActive ? 'text-primary' : 'text-gray-medium'
              }`}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
