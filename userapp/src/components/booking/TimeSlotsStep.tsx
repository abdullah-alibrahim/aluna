import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { formatTime12h } from '@/utils/helper';
import { t } from '@/i18n';

interface Slot {
  time: string;
  staffId: string;
  staffName: string;
}

interface TimeSlotsStepProps {
  bookingFlowLoading: boolean;
  availableSlots: Slot[];
  selectedSlot: Slot | null;
  setSelectedSlot: (slot: Slot) => void;
  selectedStaffId: string;
  colors: any;
}

export default function TimeSlotsStep({
  bookingFlowLoading,
  availableSlots,
  selectedSlot,
  setSelectedSlot,
  selectedStaffId,
  colors,
}: TimeSlotsStepProps) {
  if (bookingFlowLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="font-figtree-medium text-gray-dark mt-4">{t('booking.generatingSlots')}</Text>
      </View>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <CalendarDays size={32} color={colors.gray.medium} />
        </View>
        <Text className="font-figtree-bold text-xl text-black-main mb-2 text-center">{t('booking.fullyBooked')}</Text>
        <Text className="font-figtree-medium text-center text-gray-dark leading-6">
          {t('booking.noSlotsHint')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      <Text className="font-figtree-bold text-xl text-black-main mb-4">{t('booking.availableTimes')}</Text>
      <View className="flex-row flex-wrap gap-x-[3.5%] gap-y-4">
        {availableSlots.map((slot, index) => {
          const isSelected = selectedSlot && selectedSlot.time === slot.time && selectedSlot.staffId === slot.staffId;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedSlot(slot)}
              className={`w-[31%] py-3.5 items-center justify-center rounded-full border ${
                isSelected ? 'border-primary bg-primary/5' : 'border-gray-lighter bg-white'
              }`}
            >
              <Text className={`font-figtree-medium text-[15px] ${isSelected ? 'text-primary' : 'text-gray-medium'}`}>
                {formatTime12h(slot.time)}
              </Text>
              {selectedStaffId === 'any' && (
                <Text className={`font-figtree-medium text-[9px] ${isSelected ? 'text-primary' : 'text-gray-light'}`} numberOfLines={1}>
                  {t('booking.withStaff')} {(slot.staffName || '').split(' ')[0]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
