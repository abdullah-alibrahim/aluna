import React, { useMemo, useState, forwardRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { X, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setExploreFilters } from '@/store/slices/exploreSlice';
import { t } from '@/i18n';

interface FilterSheetProps {
  onApply: () => void;
}

const FilterSheet = forwardRef<BottomSheetModal, FilterSheetProps>(({ onApply }, ref) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.explore);

  const [localSortBy, setLocalSortBy] = useState(filters.sortBy || 'featured');
  const [localMinRating, setLocalMinRating] = useState(filters.minRating || 0);
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice?.toString() || '');
  const [localDistance, setLocalDistance] = useState(filters.distance || 10000);

  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const handleApply = () => {
    dispatch(setExploreFilters({
      sortBy: localSortBy,
      minRating: localMinRating > 0 ? localMinRating : undefined,
      minPrice: localMinPrice ? parseFloat(localMinPrice) : undefined,
      maxPrice: localMaxPrice ? parseFloat(localMaxPrice) : undefined,
      distance: localDistance,
    }));
    onApply();
  };

  const handleClear = () => {
    setLocalSortBy('featured');
    setLocalMinRating(0);
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setLocalDistance(10000);
  };

  const sortOptions = [
    { id: 'featured', label: t('explore.featured') },
    { id: 'rating', label: t('explore.topRated') },
    { id: 'price_low', label: t('explore.priceLow') },
    { id: 'price_high', label: t('explore.priceHigh') },
  ];

  const distanceOptions = [
    { value: 5000, label: '5 كم' },
    { value: 10000, label: '10 كم' },
    { value: 20000, label: '20 كم' },
    { value: 50000, label: '50 كم' },
  ];

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      backgroundStyle={{ backgroundColor: '#F9F5EB', borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      onAnimate={(from, to) => {
        if (to === 0) {
          setLocalSortBy(filters.sortBy || 'featured');
          setLocalMinRating(filters.minRating || 0);
          setLocalMinPrice(filters.minPrice?.toString() || '');
          setLocalMaxPrice(filters.maxPrice?.toString() || '');
          setLocalDistance(filters.distance || 10000);
        }
      }}
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-lighter">
          <Text className="font-figtree-bold text-xl text-black-main">{t('explore.filters')}</Text>
          <TouchableOpacity 
            onPress={() => {
              if (ref && typeof ref !== 'function') {
                ref.current?.dismiss();
              }
            }} 
            className="p-2 -mr-2 bg-white rounded-full border border-gray-lighter"
          >
            <X size={20} color="#14110A" />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="font-figtree-bold text-base text-black-main mb-3">{t('explore.sortBy')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {sortOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setLocalSortBy(opt.id as any)}
                className={`px-4 py-2 rounded-full border ${
                  localSortBy === opt.id ? 'bg-primary border-primary' : 'bg-white border-gray-lighter'
                }`}
              >
                <Text className={`font-figtree-medium text-sm ${
                  localSortBy === opt.id ? 'text-white' : 'text-gray-medium'
                }`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-figtree-bold text-base text-black-main mb-3">{t('explore.minRating')}</Text>
          <View className="flex-row items-center gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setLocalMinRating(star)}
                className="items-center"
              >
                <Star
                  size={32}
                  color={localMinRating >= star ? '#F59E0B' : '#D1D5DB'}
                  fill={localMinRating >= star ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
            {localMinRating > 0 && (
              <TouchableOpacity onPress={() => setLocalMinRating(0)} className="ml-auto">
                <Text className="font-figtree-medium text-xs text-primary">{t('explore.clear')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="font-figtree-bold text-base text-black-main mb-3">{t('explore.maxDistance')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {distanceOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setLocalDistance(opt.value)}
                className={`px-4 py-2 rounded-full border ${
                  localDistance === opt.value ? 'bg-primary border-primary' : 'bg-white border-gray-lighter'
                }`}
              >
                <Text className={`font-figtree-medium text-sm ${
                  localDistance === opt.value ? 'text-white' : 'text-gray-medium'
                }`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-figtree-bold text-base text-black-main mb-3">{t('explore.priceRange')}</Text>
          <View className="flex-row items-center justify-between gap-4 mb-10">
            <View className="flex-1 bg-white border border-gray-lighter rounded-2xl px-4 py-3">
              <Text className="font-figtree-regular text-xs text-gray-medium mb-1">{t('explore.minimum')}</Text>
              <BottomSheetTextInput
                value={localMinPrice}
                onChangeText={setLocalMinPrice}
                placeholder="0"
                keyboardType="numeric"
                className="font-figtree-bold text-base text-black-main p-0"
              />
            </View>
            <Text className="font-figtree-bold text-gray-medium">-</Text>
            <View className="flex-1 bg-white border border-gray-lighter rounded-2xl px-4 py-3">
              <Text className="font-figtree-regular text-xs text-gray-medium mb-1">{t('explore.maximum')}</Text>
              <BottomSheetTextInput
                value={localMaxPrice}
                onChangeText={setLocalMaxPrice}
                placeholder={t('explore.any')}
                keyboardType="numeric"
                className="font-figtree-bold text-base text-black-main p-0"
              />
            </View>
          </View>
        </BottomSheetScrollView>

        <View className="p-4 border-t border-gray-lighter bg-background flex-row items-center gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity 
            onPress={handleClear}
            className="flex-1 py-4 items-center justify-center rounded-full bg-white border border-gray-lighter shadow-sm shadow-black/5"
          >
            <Text className="font-figtree-bold text-base text-black-main">{t('explore.clear')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleApply}
            className="flex-1 py-4 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/30"
          >
            <Text className="font-figtree-bold text-base text-white">{t('explore.applyFilters')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
});

export default FilterSheet;
