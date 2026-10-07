import React, { useCallback, useEffect, useState, forwardRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedCity, fetchHomeData } from '@/store/slices/homeSlice';
import apiClient from '@/api/client';

export interface City {
  _id: string;
  name: string;
  isActive: boolean;
  coordinates?: {
    type?: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  location?: {
    type?: string;
    coordinates: [number, number];
  };
}

const CitySelectionSheet = forwardRef<BottomSheetModal, any>((props, ref) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { selectedCity } = useAppSelector((state) => state.home);
  
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Snap points for the bottom sheet MUST be memoized
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/cities');
      setCities(res.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleCitySelect = async (city: City) => {
    try {
      const coords =
        city.coordinates?.coordinates ||
        city.location?.coordinates;

      const cityData = {
        _id: city._id,
        name: city.name,
        ...(Array.isArray(coords) && coords.length >= 2
          ? {
              location: {
                type: city.coordinates?.type || city.location?.type || 'Point',
                coordinates: coords,
              },
            }
          : {}),
      };

      await AsyncStorage.setItem('selectedCity', JSON.stringify(cityData));
      dispatch(setSelectedCity(cityData));
      dispatch(fetchHomeData(city._id));

      if (ref && typeof ref !== 'function') {
        ref.current?.dismiss();
      }
    } catch (error) {
      console.error('Failed to save city:', error);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
      backgroundStyle={{ backgroundColor: '#FFFFFF' }}
    >
      <View className="flex-1 px-4 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <View className="items-center mb-3">
          <Text className="font-figtree-bold text-xl text-black-main mb-1">
            اختاري موقعك
          </Text>
          <Text className="font-figtree-medium text-sm text-gray-medium text-center">
            اختاري مدينتك لاكتشاف أفضل الصالونات والخدمات حولك.
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#B59451" />
          </View>
        ) : (
          <BottomSheetFlatList
            data={cities}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedCity?._id === item._id;
              
              return (
                <TouchableOpacity
                  onPress={() => handleCitySelect(item)}
                  className={`flex-row items-center justify-between px-4 py-3 mb-3 rounded-2xl border ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-gray-lighter bg-white'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      isSelected ? 'bg-primary/20' : 'bg-background'
                    }`}>
                      <MapPin color={isSelected ? "#B59451" : "#706256"} size={20} strokeWidth={2.5} />
                    </View>
                    <Text className={`font-figtree-bold text-[16px] ${
                      isSelected ? 'text-primary' : 'text-black-main'
                    }`}>
                      {item.name}
                    </Text>
                  </View>
                  
                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                      <Check color="#FFFFFF" size={14} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </BottomSheetModal>
  );
});

export default CitySelectionSheet;
