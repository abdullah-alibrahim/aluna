import React, { useMemo, useState, forwardRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { X, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '@/api/client';
import { t } from '@/i18n';

interface ReviewModalProps {
  bookingId: string;
  shopId: string;
  shopName?: string;
  onSuccess: () => void;
}

const ReviewModal = forwardRef<BottomSheetModal, ReviewModalProps>(({ bookingId, shopId, shopName, onSuccess }, ref) => {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const ratingLabel =
    rating >= 1 && rating <= 5
      ? t(`review.ratingLabels.${rating}`)
      : t('review.howWasExperience');

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert(t('common.error'), t('review.invalidRating'));
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post(`/reviews/${shopId}`, {
        bookingId,
        rating,
        comment,
      });
      
      Alert.alert(t('common.success'), t('review.thankYou'));
      onSuccess();
      
      if (ref && typeof ref !== 'function') {
        ref.current?.dismiss();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || t('review.submitFailed');
      Alert.alert(t('common.error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          setRating(0);
          setComment('');
        }
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-lighter">
          <Text className="font-figtree-bold text-xl text-black-main">{t('review.leaveReview')}</Text>
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

        <View className="flex-1 px-6 pt-6">
          {!!shopName && (
            <Text className="font-figtree-medium text-sm text-gray-medium text-center mb-2">{shopName}</Text>
          )}
          <Text className="font-figtree-bold text-lg text-black-main text-center mb-2">
            {t('review.rateNow')}
          </Text>
          <Text className="font-figtree-semibold text-base text-primary text-center mb-6">
            {ratingLabel}
          </Text>
          
          <View className="flex-row items-center justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="items-center p-1"
                accessibilityLabel={`${star} stars`}
              >
                <Star
                  size={44}
                  color={rating >= star ? '#F59E0B' : '#D1D5DB'}
                  fill={rating >= star ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-figtree-bold text-base text-black-main mb-3">
            {t('review.addComment')}
          </Text>
          <View className="bg-white border border-gray-lighter rounded-2xl p-4 h-36">
            <BottomSheetTextInput
              value={comment}
              onChangeText={setComment}
              placeholder={t('review.placeholder')}
              placeholderTextColor="#9C8C80"
              multiline
              textAlignVertical="top"
              textAlign="right"
              className="flex-1 font-figtree-medium text-base text-black-main p-0"
            />
          </View>
        </View>

        <View className="p-4 border-t border-gray-lighter bg-background" style={{ paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting || rating < 1}
            className={`py-4 items-center justify-center rounded-full shadow-sm shadow-primary/30 ${
              isSubmitting || rating < 1 ? 'bg-primary/50' : 'bg-primary'
            }`}
          >
            <Text className="font-figtree-bold text-base text-white">
              {isSubmitting ? t('review.submitting') : t('review.submitReview')}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ReviewModal;
