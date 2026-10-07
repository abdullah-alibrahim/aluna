import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { t } from '@/i18n';

interface SearchBarProps {
  onPress?: () => void;
}

export default function SearchBar({ onPress }: SearchBarProps) {
  return (
    <View className="px-4 my-2">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        className="flex-row items-center bg-white border border-gray-lighter rounded-2xl px-4 py-3.5"
        style={{
          shadowColor: '#B59451',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <Search color="#B59451" size={20} />
        <Text className="flex-1 mr-3 text-right text-[#9C8C80] font-figtree text-[15px]">
          {t('home.searchPlaceholder')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
