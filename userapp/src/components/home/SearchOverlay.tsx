import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Search, ArrowLeft, X } from 'lucide-react-native';
import apiClient from '@/api/client';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ShopCard from './ShopCard';

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  cityId?: string;
}

export default function SearchOverlay({ visible, onClose, cityId }: SearchOverlayProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timerId = setTimeout(() => {
      performSearch(query.trim());
    }, 500);

    return () => clearTimeout(timerId);
  }, [query, cityId]);

  const performSearch = async (searchText: string) => {
    setLoading(true);
    try {
      const endpoint = cityId 
        ? `/users/shops?cityId=${cityId}&search=${encodeURIComponent(searchText)}` 
        : `/users/shops?search=${encodeURIComponent(searchText)}`;
      const res = await apiClient.get(endpoint);
      setResults(res.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <KeyboardAwareScrollView
          bottomOffset={20}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center px-3 py-3 bg-white shadow-sm">
            <TouchableOpacity onPress={onClose} className="p-2 mr-1">
              <ArrowLeft color="#14110A" size={24} />
            </TouchableOpacity>
            
            <View className="flex-1 flex-row items-center bg-gray-50 rounded-full px-3 py-2 border border-gray-200">
              <Search color="#9C8C80" size={18} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="ابحثي عن صالون أو متخصصة"
                placeholderTextColor="#9C8C80"
                className="flex-1 ml-2 text-black-main font-figtree text-base p-0"
                autoFocus={true}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} className="p-1">
                  <X color="#9C8C80" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Results */}
          <View className="flex-1 bg-[#FAFAFA] px-3 pt-4">
            {loading ? (
              <View className="mt-10">
                <ActivityIndicator size="large" color="#FF8243" />
              </View>
            ) : query.trim() && results.length === 0 ? (
              <View className="mt-10 items-center">
                <Text className="text-gray-medium font-figtree-medium text-base">لا توجد نتائج لـ "{query}"</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between pb-10">
                {results.map((item) => (
                  <ShopCard key={item._id} item={item} onPress={onClose} />
                ))}
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}
