import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  Linking,
  Image
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { 
  Calendar,
  MapPin,
  User,
  Scissors,
  CreditCard,
  X
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyBookings, Booking, cancelMyBooking } from '@/store/slices/bookingSlice';
import ReviewModal from '@/components/bookings/ReviewModal';
import { fetchSettings } from '@/store/slices/settingSlice';
import { bookingStatusLabel, paymentMethodLabel, paymentStatusLabel, t } from '@/i18n';
import { formatMoney } from '@/utils/helper';
import { exitGuestForAuth } from '@/store/slices/authSlice';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

const UserBookingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  
  const { bookings, loading } = useAppSelector(state => state.bookings);
  const { settings } = useAppSelector(state => state.settings);
  const { isGuest, isAuthenticated } = useAppSelector(state => state.auth);
  const currency = settings?.currency || 'ل.س';

  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Review Modal State
  const reviewModalRef = React.useRef<BottomSheetModal>(null);
  const [reviewBooking, setReviewBooking] = useState<{ bookingId: string; shopId: string; shopName?: string } | null>(null);

  React.useEffect(() => {
    if (reviewBooking) {
      if (reviewModalRef.current) {
        reviewModalRef.current.present();
      } else {
        Alert.alert(t('common.error'), t('bookings.modalError'));
      }
    }
  }, [reviewBooking]);

  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['85%'], []);

  const handlePresentModalPress = React.useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismissModalPress = React.useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchSettings());
      if (!isGuest && isAuthenticated) {
        dispatch(fetchMyBookings());
      }
    }, [dispatch, isGuest, isAuthenticated])
  );

  // Sync selected booking if it gets updated in the background
  React.useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find(b => b._id === selectedBooking._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedBooking)) {
        setSelectedBooking(updated);
      }
    }
  }, [bookings]);

  const now = dayjs();

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(t('bookings.cancelBooking'), t('bookings.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bookings.cancelBooking'),
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(cancelMyBooking(booking._id)).unwrap();
            Alert.alert(t('common.success'), t('bookings.cancelSuccess'));
            handleDismissModalPress();
            dispatch(fetchMyBookings());
          } catch (e: any) {
            Alert.alert(t('common.error'), typeof e === 'string' ? e : t('bookings.cancelFailed'));
          }
        },
      },
    ]);
  };

  const pendingReviews = bookings.filter((b) => b.status === 'completed' && !b.isReviewed);

  const filteredBookings = bookings.filter(b => {
    const bookingDate = dayjs(`${dayjs(b.date).format('YYYY-MM-DD')}T${b.startTime}`);
    
    if (activeTab === 'upcoming') {
      return (b.status === 'pending' || b.status === 'confirmed') && bookingDate.isAfter(now);
    }
    if (activeTab === 'completed') {
      return b.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return b.status === 'cancelled' || b.status === 'no_show';
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-light text-warning';
      case 'confirmed': return 'bg-success/20 text-success';
      case 'completed': return 'bg-success-light text-success';
      case 'cancelled': return 'bg-error-light text-error';
      case 'no_show': return 'bg-error-light text-error';
      default: return 'bg-gray-200 text-gray-dark';
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <View className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5">
      <TouchableOpacity 
        onPress={() => handlePresentModalPress(item)}
        activeOpacity={0.7}
      >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
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
          <Text className="font-figtree-medium text-sm text-black-main">{item.shopId?.name || t('bookings.unknownSalon')}</Text>
          <Text className="font-figtree-bold text-sm text-black-main">{formatMoney(item.totalPrice, currency)}</Text>
        </View>
        <View className="flex-row items-center gap-2 pr-2">
          <MapPin size={12} color={colors.gray.medium} />
          <Text className="font-figtree-regular text-xs text-gray-medium flex-1" numberOfLines={1}>{item.shopId?.address}</Text>
        </View>
        </View>
      </TouchableOpacity>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-lighter">
        <View className="flex-1">
          <Text className="font-figtree-regular text-xs text-gray-dark">
            {item.serviceIds.length} خدمة • {item.staffId?.name}
          </Text>
          <View className={`self-start px-2 py-0.5 rounded-full mt-1 ${item.paymentStatus === 'paid' ? 'bg-success-light' : item.status === 'cancelled' ? 'bg-error-light' : 'bg-warning-light'}`}>
            <Text className={`font-figtree-semibold text-[10px] ${item.paymentStatus === 'paid' ? 'text-success' : item.status === 'cancelled' ? 'text-error' : 'text-warning'}`}>
              {item.status === 'cancelled' ? paymentStatusLabel('cancelled') : `${paymentMethodLabel(item.paymentMethod)} · ${paymentStatusLabel(item.paymentStatus)}`}
            </Text>
          </View>
        </View>
        
        {item.status === 'completed' && !item.isReviewed && item.shopId?._id && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setReviewBooking({
                bookingId: item._id,
                shopId: item.shopId._id,
                shopName: item.shopId?.name,
              });
            }}
            className="bg-primary px-4 py-2.5 rounded-full flex-row items-center"
          >
            <Text className="font-figtree-bold text-xs text-white">{t('review.rateCta')}</Text>
          </TouchableOpacity>
        )}
        {item.status === 'completed' && item.isReviewed && (
          <View className="bg-success/10 px-3 py-1.5 rounded-full">
            <Text className="font-figtree-bold text-xs text-success">{t('review.reviewed')}</Text>
          </View>
        )}
        {(item.status === 'pending' || item.status === 'confirmed') && (
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('RescheduleBooking', { booking: item })}
              className="px-3 py-2 rounded-full bg-primary/10"
            >
              <Text className="font-figtree-bold text-xs text-primary">إعادة جدولة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCancelBooking(item)}
              className="px-3 py-2 rounded-full bg-error/10"
            >
              <Text className="font-figtree-bold text-xs text-error">{t('bookings.cancelBooking')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-4 bg-background z-10">
        <Text className="font-figtree-bold text-2xl text-black-main">حجوزاتي</Text>
      </View>

      {pendingReviews.length > 0 && activeTab !== 'completed' && (
        <TouchableOpacity
          onPress={() => setActiveTab('completed')}
          className="mx-3 mb-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 flex-row items-center justify-between"
        >
          <Text className="font-figtree-semibold text-sm text-black-main flex-1">
            {t('review.pendingBanner')} ({pendingReviews.length})
          </Text>
          <Text className="font-figtree-bold text-sm text-primary">{t('review.rateCta')}</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View className="px-3 py-3 bg-background">
        <View className="flex-row bg-gray-200 rounded-full p-1">
          {[
            { key: 'upcoming', label: 'القادمة' },
            { key: 'completed', label: 'مكتملة' },
            { key: 'cancelled', label: 'ملغاة' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-full items-center justify-center ${activeTab === tab.key ? 'bg-white' : 'bg-transparent'}`}
            >
              <Text className={`font-figtree-semibold text-xs ${activeTab === tab.key ? 'text-black-main' : 'text-gray-medium'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {loading && !isGuest && isAuthenticated ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isGuest || !isAuthenticated ? (
        <View className="flex-1 items-center justify-center mt-20 px-6">
          <Calendar size={48} color={colors.gray.light} className="mb-4" />
          <Text className="font-figtree-bold text-xl text-black-main mb-2 text-center">سجّلي الدخول لحجوزاتك</Text>
          <Text className="font-figtree-medium text-gray-medium text-center mb-6">
            تابعي مواعيدك وإلغاء الحجوزات بعد تسجيل الدخول.
          </Text>
          <TouchableOpacity
            onPress={() => dispatch(exitGuestForAuth('Login'))}
            className="bg-primary px-8 py-4 rounded-full"
          >
            <Text className="text-white font-figtree-bold text-base">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item => item._id}
          renderItem={renderBookingCard}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Calendar size={48} color={colors.gray.light} className="mb-4" />
              <Text className="font-figtree-medium text-gray-medium text-base">لا توجد حجوزات في هذا التصنيف</Text>
            </View>
          }
        />
      )}

      {/* Details Modal using BottomSheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onDismiss={() => setSelectedBooking(null)}
        backdropComponent={React.useCallback(
          (props: any) => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              pressBehavior="close"
            />
          ),
          []
        )}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 32 }}
      >
        <BottomSheetView className="flex-1 px-5 pt-2">
          {selectedBooking && (
            <BottomSheetScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text className="font-figtree-bold text-2xl text-black-main">{t('bookings.details')}</Text>
                <TouchableOpacity 
                  onPress={handleDismissModalPress}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <X size={18} color="#14110A" />
                </TouchableOpacity>
              </View>

                {/* Main Info */}
                <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2 pr-2 flex-1">
                      <MapPin size={16} color={colors.primary} />
                      <Text className="font-figtree-bold text-sm text-black-main flex-1" numberOfLines={1}>{selectedBooking.shopId?.name}</Text>
                    </View>
                  </View>
                  <Text className="font-figtree-regular text-xs text-gray-medium ml-6 pr-2">{selectedBooking.shopId?.address}</Text>
                </View>

                {/* Time & Status */}
                <View className="flex-row mb-4">
                  <View className="flex-1 bg-white p-4 rounded-3xl mr-2 border border-gray-lighter shadow-sm shadow-black/5">
                    <Text className="font-figtree-regular text-xs text-gray-medium mb-1">{t('booking.dateTime')}</Text>
                    <Text className="font-figtree-bold text-sm text-black-main mb-1">
                      {dayjs(selectedBooking.date).format('MMM D, YYYY')}
                    </Text>
                    <Text className="font-figtree-semibold text-primary text-xs">
                      {selectedBooking.startTime} - {selectedBooking.endTime}
                    </Text>
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-3xl ml-2 border border-gray-lighter shadow-sm shadow-black/5 justify-between">
                    <View>
                      <Text className="font-figtree-regular text-xs text-gray-medium mb-1">{t('bookings.bookingStatus')}</Text>
                      <View className={`self-start px-2 py-0.5 rounded-full ${getStatusColor(selectedBooking.status).split(' ')[0]}`}>
                        <Text className={`font-figtree-semibold text-[10px] ${getStatusColor(selectedBooking.status).split(' ')[1]}`}>
                          {bookingStatusLabel(selectedBooking.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Services */}
                <Text className="font-figtree-bold text-lg text-black-main mb-3 ml-1">{t('booking.services')}</Text>
                <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
                  {selectedBooking.serviceIds.map((service, index) => (
                    <View key={index} className={`flex-row justify-between items-center ${index !== selectedBooking.serviceIds.length - 1 ? 'mb-3 pb-3 border-b border-gray-100' : ''}`}>
                      <View className="flex-1 pr-4">
                        <Text className="font-figtree-semibold text-sm text-black-main mb-1">{service.name}</Text>
                        <Text className="font-figtree-regular text-xs text-gray-medium">{service.duration} {t('common.minutes')}</Text>
                      </View>
                      <Text className="font-figtree-bold text-sm text-black-main">{formatMoney(service.price, currency)}</Text>
                    </View>
                  ))}
                  <View className="flex-row items-center justify-between pt-3 mt-1 border-t border-dashed border-gray-200">
                    <View className="flex-row items-center gap-2">
                      <Scissors size={14} color={colors.gray.medium} />
                      <Text className="font-figtree-medium text-xs text-gray-dark">{t('bookings.specialist')} {selectedBooking.staffId?.name}</Text>
                    </View>
                  </View>
                </View>

                {/* Payment Summary */}
                <Text className="font-figtree-bold text-lg text-black-main mb-3 ml-1">{t('payments.title')}</Text>
                <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-figtree-regular text-sm text-gray-medium">{t('common.subtotal')}</Text>
                    <Text className="font-figtree-semibold text-sm text-black-main">{formatMoney(selectedBooking.originalPrice, currency)}</Text>
                  </View>
                  {selectedBooking.discountAmount > 0 && (
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-figtree-regular text-sm text-gray-medium">{t('common.discount')}</Text>
                      <Text className="font-figtree-semibold text-sm text-error">-{formatMoney(selectedBooking.discountAmount, currency)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between items-center pt-3 mt-1 border-t border-gray-100">
                    <Text className="font-figtree-bold text-base text-black-main">{t('common.total')}</Text>
                    <Text className="font-figtree-bold text-xl text-primary">{formatMoney(selectedBooking.totalPrice, currency)}</Text>
                  </View>

                  {(selectedBooking.depositAmount ?? 0) > 0 && (
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="font-figtree-regular text-sm text-gray-medium">{t('bookings.deposit')}</Text>
                      <Text className="font-figtree-semibold text-sm text-black-main">{formatMoney(selectedBooking.depositAmount, currency)}</Text>
                    </View>
                  )}
                  {(selectedBooking.feeCharged ?? 0) > 0 && (
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="font-figtree-regular text-sm text-error">{t('bookings.feeApplied')}</Text>
                      <Text className="font-figtree-semibold text-sm text-error">{formatMoney(selectedBooking.feeCharged, currency)}</Text>
                    </View>
                  )}
                  
                  <View className="flex-row items-center justify-between mt-4 bg-background p-3 rounded-xl border border-gray-lighter">
                    <View className="flex-row items-center gap-2">
                      <CreditCard size={16} color={selectedBooking.paymentStatus === 'paid' ? colors.success.DEFAULT : colors.warning.DEFAULT} />
                      <Text className="font-figtree-medium text-xs text-black-main">{t('bookings.paymentStatus')}</Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded-full ${selectedBooking.paymentStatus === 'paid' ? 'bg-success-light' : 'bg-warning-light'}`}>
                      <Text className={`font-figtree-semibold text-[10px] ${selectedBooking.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}`}>
                        {paymentMethodLabel(selectedBooking.paymentMethod)} · {paymentStatusLabel(selectedBooking.paymentStatus)}
                      </Text>
                    </View>
                  </View>
                </View>

                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <View className="mb-4 gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        handleDismissModalPress();
                        navigation.navigate('RescheduleBooking', { booking: selectedBooking });
                      }}
                      className="w-full bg-primary h-14 rounded-2xl items-center justify-center"
                    >
                      <Text className="text-white font-figtree-bold text-base">إعادة جدولة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCancelBooking(selectedBooking)}
                      className="w-full bg-error/10 h-14 rounded-2xl items-center justify-center"
                    >
                      <Text className="text-error font-figtree-bold text-base">{t('bookings.cancelBooking')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBooking.status === 'completed' && !selectedBooking.isReviewed && selectedBooking.shopId?._id && (
                  <TouchableOpacity
                    onPress={() => {
                      handleDismissModalPress();
                      setReviewBooking({
                        bookingId: selectedBooking._id,
                        shopId: selectedBooking.shopId._id,
                        shopName: selectedBooking.shopId?.name,
                      });
                    }}
                    className="w-full bg-primary h-14 rounded-2xl items-center justify-center mb-4"
                  >
                    <Text className="text-white font-figtree-bold text-base">{t('review.rateNow')}</Text>
                  </TouchableOpacity>
                )}

            </BottomSheetScrollView>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Review Modal */}
      {/* Review Modal */}
      <ReviewModal
        ref={reviewModalRef}
        bookingId={reviewBooking?.bookingId || ''}
        shopId={reviewBooking?.shopId || ''}
        shopName={reviewBooking?.shopName}
        onSuccess={() => {
          dispatch(fetchMyBookings());
          setReviewBooking(null);
        }}
      />
    </View>
  );
};

export default UserBookingsScreen;
