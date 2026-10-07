import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  MapPin,
  User,
  Scissors,
  CreditCard,
  CircleDollarSign,
  X
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAllBookings, Booking } from '@/store/slices/bookingSlice';
import { fetchSettings } from '@/store/slices/settingSlice';
import dayjs from 'dayjs';
import { bookingStatusLabel, paymentMethodLabel, paymentStatusLabel, t } from '@/i18n';
import { formatMoney } from '@/utils/helper';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

const AdminBookingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { bookings, loading } = useAppSelector(state => state.bookings);
  const { settings } = useAppSelector(state => state.settings);
  const currency = settings?.currency || 'ل.س';

  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    dispatch(fetchAllBookings());
    dispatch(fetchSettings());
  }, [dispatch]);

  const now = dayjs();

  const filteredBookings = bookings.filter(b => {
    const bookingDate = dayjs(`${dayjs(b.date).format('YYYY-MM-DD')}T${b.startTime}`);
    
    if (activeTab === 'upcoming') {
      return (b.status === 'pending' || b.status === 'confirmed') && bookingDate.isAfter(now);
    }
    if (activeTab === 'completed') {
      return b.status === 'completed' || bookingDate.isBefore(now);
    }
    if (activeTab === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-light text-warning';
      case 'confirmed': return 'bg-success/20 text-success';
      case 'completed': return 'bg-success-light text-success';
      case 'cancelled': return 'bg-error-light text-error';
      default: return 'bg-gray-200 text-gray-dark';
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity 
      onPress={() => setSelectedBooking(item)}
      className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
            <Calendar size={18} color={colors.primary} />
          </View>
          <View>
            <Text className="font-figtree-bold text-base text-black-main">
              {dayjs(item.date).format('MMM D, YYYY')}
            </Text>
            <Text className="font-figtree-medium text-xs text-primary">
              {item.startTime} - {item.endTime}
            </Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
          <Text className={`font-figtree-semibold text-[10px] tracking-wider ${getStatusColor(item.status).split(' ')[1]}`}>
            {bookingStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View className="bg-background rounded-2xl p-3 mb-3 border border-gray-lighter">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-figtree-medium text-sm text-black-main">{item.userId?.name || 'عميل'}</Text>
          <Text className="font-figtree-bold text-sm text-black-main">{formatMoney(item.totalPrice, currency)}</Text>
        </View>
        <View className="flex-row items-center">
          <MapPin size={12} color={colors.gray.medium} className="mr-1" />
          <Text className="font-figtree-regular text-xs text-gray-medium" numberOfLines={1}>{item.shopId?.name}</Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <Text className="font-figtree-regular text-xs text-gray-dark">
          {item.serviceIds.length} خدمة • {item.staffId?.name} • {paymentMethodLabel(item.paymentMethod)} · {paymentStatusLabel(item.paymentStatus)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-4 bg-background z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
        >
          <ArrowLeft size={20} color={colors['black-main']} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-figtree-bold text-xl text-black-main">كل الحجوزات</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 py-3 bg-background">
        <View className="flex-row bg-gray-200 rounded-full p-1">
          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-full items-center justify-center ${activeTab === tab ? 'bg-white' : 'bg-transparent'}`}
            >
              <Text className={`font-figtree-semibold text-xs ${activeTab === tab ? 'text-black-main' : 'text-gray-medium'}`}>
                {tab === 'upcoming' ? t('bookingStatus.upcoming') : bookingStatusLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item => item._id}
          renderItem={renderBookingCard}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Calendar size={48} color={colors.gray.light} className="mb-4" />
              <Text className="font-figtree-medium text-gray-medium text-base">لا توجد حجوزات في هذا التصنيف</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal visible={!!selectedBooking} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-[32px] p-5 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom + 20, 40), maxHeight: '85%' }}>
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            
            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-figtree-bold text-2xl text-black-main">تفاصيل الحجز</Text>
                  <TouchableOpacity 
                    onPress={() => setSelectedBooking(null)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <X size={18} color="#14110A" />
                  </TouchableOpacity>
                </View>

                {/* Main Info */}
                <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
                  <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <View className="flex-row items-center">
                      <User size={18} color={colors.gray.medium} className="mr-2" />
                      <Text className="font-figtree-semibold text-black-main text-base">{selectedBooking.userId?.name}</Text>
                    </View>
                    <Text className="font-figtree-medium text-xs text-gray-medium">{selectedBooking.userId?.email}</Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <MapPin size={16} color={colors.primary} className="mr-2" />
                      <Text className="font-figtree-bold text-sm text-black-main">{selectedBooking.shopId?.name}</Text>
                    </View>
                  </View>
                  <Text className="font-figtree-regular text-xs text-gray-medium ml-6">{selectedBooking.shopId?.address}</Text>
                </View>

                {/* Time & Status */}
                <View className="flex-row mb-4">
                  <View className="flex-1 bg-white p-4 rounded-3xl mr-2 border border-gray-lighter shadow-sm shadow-black/5">
                    <Text className="font-figtree-regular text-xs text-gray-medium mb-1">التاريخ والوقت</Text>
                    <Text className="font-figtree-bold text-sm text-black-main mb-1">
                      {dayjs(selectedBooking.date).format('MMM D, YYYY')}
                    </Text>
                    <Text className="font-figtree-semibold text-primary text-xs">
                      {selectedBooking.startTime} - {selectedBooking.endTime}
                    </Text>
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-3xl ml-2 border border-gray-lighter shadow-sm shadow-black/5 justify-between">
                    <View>
                      <Text className="font-figtree-regular text-xs text-gray-medium mb-1">الحالة</Text>
                      <View className={`self-start px-2 py-0.5 rounded-full ${getStatusColor(selectedBooking.status).split(' ')[0]}`}>
                        <Text className={`font-figtree-semibold text-[10px] ${getStatusColor(selectedBooking.status).split(' ')[1]}`}>
                          {bookingStatusLabel(selectedBooking.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Services */}
                <Text className="font-figtree-bold text-lg text-black-main mb-3 ml-1">الخدمات</Text>
                <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
                  {selectedBooking.serviceIds.map((service, index) => (
                    <View key={index} className={`flex-row justify-between items-center ${index !== selectedBooking.serviceIds.length - 1 ? 'mb-3 pb-3 border-b border-gray-100' : ''}`}>
                      <View className="flex-1 pr-4">
                        <Text className="font-figtree-semibold text-sm text-black-main mb-1">{service.name}</Text>
                        <Text className="font-figtree-regular text-xs text-gray-medium">{service.duration} mins</Text>
                      </View>
                      <Text className="font-figtree-bold text-sm text-black-main">{formatMoney(service.price, currency)}</Text>
                    </View>
                  ))}
                  <View className="flex-row items-center justify-between pt-3 mt-1 border-t border-dashed border-gray-200">
                    <View className="flex-row items-center">
                      <Scissors size={14} color={colors.gray.medium} className="mr-2" />
                      <Text className="font-figtree-medium text-xs text-gray-dark">المتخصصة: {selectedBooking.staffId?.name}</Text>
                    </View>
                  </View>
                </View>

                {/* Payment Summary */}
                <Text className="font-figtree-bold text-lg text-black-main mb-3 ml-1">الدفع</Text>
                <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-figtree-regular text-sm text-gray-medium">المجموع الفرعي</Text>
                    <Text className="font-figtree-semibold text-sm text-black-main">{formatMoney(selectedBooking.originalPrice, currency)}</Text>
                  </View>
                  {Number(selectedBooking.discountAmount || 0) > 0 && (
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-figtree-regular text-sm text-gray-medium">الخصم</Text>
                      <Text className="font-figtree-semibold text-sm text-error">-{formatMoney(selectedBooking.discountAmount, currency)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between items-center pt-3 mt-1 border-t border-gray-100">
                    <Text className="font-figtree-bold text-base text-black-main">الإجمالي</Text>
                    <Text className="font-figtree-bold text-xl text-primary">{formatMoney(selectedBooking.totalPrice, currency)}</Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between mt-4 bg-background p-3 rounded-xl border border-gray-lighter">
                    <View className="flex-row items-center">
                      <CreditCard size={16} color={selectedBooking.paymentStatus === 'paid' ? colors.success.DEFAULT : colors.warning.DEFAULT} className="mr-2" />
                      <Text className="font-figtree-medium text-xs text-black-main">حالة الدفع</Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded-full ${selectedBooking.paymentStatus === 'paid' ? 'bg-success-light' : 'bg-warning-light'}`}>
                      <Text className={`font-figtree-semibold text-[10px] ${selectedBooking.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}`}>
                        {paymentMethodLabel(selectedBooking.paymentMethod)} · {paymentStatusLabel(selectedBooking.paymentStatus)}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminBookingsScreen;
