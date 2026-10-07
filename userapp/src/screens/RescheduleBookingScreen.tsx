import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getAvailability, rescheduleMyBooking } from '@/store/slices/bookingSlice';
import { calculateEndTime } from '@/utils/helper';

export default function RescheduleBookingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const booking = route.params?.booking;
  const dispatch = useAppDispatch();
  const { availableSlots, bookingFlowLoading } = useAppSelector((s) => s.bookings);

  const [dateStr, setDateStr] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const serviceQuery = useMemo(
    () => (booking?.serviceIds || []).map((s: any) => s._id || s).join(','),
    [booking]
  );
  const duration = useMemo(
    () => (booking?.serviceIds || []).reduce((a: number, s: any) => a + (s.duration || 30), 0),
    [booking]
  );

  useEffect(() => {
    if (!booking?.shopId?._id || !serviceQuery) return;
    dispatch(
      getAvailability({
        shopId: booking.shopId._id,
        dateStr,
        serviceQuery,
        staffId: booking.staffId?._id || 'any',
      })
    );
  }, [booking, dateStr, serviceQuery, dispatch]);

  const handleSave = async () => {
    if (!selectedSlot) {
      Alert.alert('تنبيه', 'اختاري موعداً جديداً');
      return;
    }
    setSaving(true);
    try {
      const endTime = calculateEndTime(selectedSlot.time, duration || 30);
      await dispatch(
        rescheduleMyBooking({
          bookingId: booking._id,
          date: dateStr,
          startTime: selectedSlot.time,
          endTime,
          staffId: selectedSlot.staffId,
        })
      ).unwrap();
      Alert.alert('تم', 'تمت إعادة جدولة الحجز');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', typeof e === 'string' ? e : 'فشلت إعادة الجدولة');
    } finally {
      setSaving(false);
    }
  };

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>الحجز غير موجود</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-3 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white border border-gray-lighter items-center justify-center"
        >
          <ArrowLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-lg text-black-main">إعادة الجدولة</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <Text className="font-figtree-medium text-sm text-gray-medium mb-2">
          {booking.shopId?.name} · {booking.staffId?.name}
        </Text>
        <Text className="font-figtree-bold text-base text-black-main mb-2">التاريخ (YYYY-MM-DD)</Text>
        <TextInput
          value={dateStr}
          onChangeText={setDateStr}
          className="bg-white border border-gray-lighter rounded-2xl px-4 py-3 mb-4 font-figtree-medium text-black-main"
          placeholder="2026-10-05"
          textAlign="right"
        />

        <Text className="font-figtree-bold text-base text-black-main mb-2">المواعيد المتاحة</Text>
        {bookingFlowLoading ? (
          <ActivityIndicator color="#B59451" />
        ) : (
          <View className="flex-row flex-wrap gap-2 mb-6">
            {(availableSlots || []).map((slot: any) => {
              const active = selectedSlot?.time === slot.time && selectedSlot?.staffId === slot.staffId;
              return (
                <TouchableOpacity
                  key={`${slot.time}-${slot.staffId}`}
                  onPress={() => setSelectedSlot(slot)}
                  className={`px-4 py-2 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-gray-lighter'}`}
                >
                  <Text className={`font-figtree-bold text-sm ${active ? 'text-white' : 'text-black-main'}`}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {!availableSlots?.length && (
              <Text className="font-figtree-medium text-gray-medium">لا مواعيد في هذا اليوم</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-primary py-4 rounded-full items-center"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-figtree-bold text-base">تأكيد الموعد الجديد</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
