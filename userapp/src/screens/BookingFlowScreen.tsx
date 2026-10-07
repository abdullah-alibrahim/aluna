import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { calculateEndTime } from '@/utils/helper';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getShopDetailsForBooking, getAvailability, createNewBooking, createGroupBooking } from '@/store/slices/bookingSlice';
import { isStoreDemoMode, storeDemoSlots } from '@/store/storeDemoData';
import { ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { fetchCoupons, Coupon } from '@/store/slices/couponSlice';
import twConfig from '../../tailwind.config.js';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Step Subcomponents
import ServicesStep from '../components/booking/ServicesStep';
import StaffDateStep from '../components/booking/StaffDateStep';
import TimeSlotsStep from '../components/booking/TimeSlotsStep';
import ConfirmationStep from '../components/booking/ConfirmationStep';
import { t } from '@/i18n';

function getStoreDemoShot(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('shot');
}

const colors = twConfig.theme.extend.colors;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingFlow'>;
type BookingFlowRouteProp = RouteProp<RootStackParamList, 'BookingFlow'>;

export default function BookingFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookingFlowRouteProp>();
  const { shop } = route.params;

  const dispatch = useAppDispatch();
  const { flowServices: services, flowStaff: allStaff, flowBranches: branches, availableSlots, loading, bookingFlowLoading } = useAppSelector(state => state.bookings);
  const { settings } = useAppSelector(state => state.settings);
  const currency = settings?.currency || t('common.currency');

  // Flow State
  const [step, setStep] = useState(1);
  const [internalBookingLoading, setInternalBookingLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const { coupons } = useAppSelector(state => state.coupon);

  // Selections
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [companions, setCompanions] = useState<{ guestName: string; staffId: string }[]>([]);
  
  // Custom Date logic
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  const staffList = React.useMemo(() => {
    if (!selectedBranchId) return allStaff;
    return allStaff.filter(
      (s: any) => !s.branchId || s.branchId === selectedBranchId || s.branchId?._id === selectedBranchId
    );
  }, [allStaff, selectedBranchId]);

  useEffect(() => {
    // Generate next 14 days
    const next14Days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
    setDates(next14Days);

    // Fetch via Redux
    dispatch(getShopDetailsForBooking(shop._id))
      .unwrap()
      .then((data) => {
        const list = data.branches || [];
        const main = list.find((b: any) => b.isMain) || list[0];
        if (main?._id) setSelectedBranchId(main._id);
      })
      .catch((error) => {
        Alert.alert(t('common.error'), error || t('booking.loadShopFailed'));
        navigation.goBack();
      });

    dispatch(fetchCoupons());
  }, [shop._id, dispatch]);

  // Store listing capture: ?storeDemo=1&shot=booking|group|cash
  useEffect(() => {
    if (!isStoreDemoMode() || !services.length) return;
    const shot = getStoreDemoShot();
    if (!shot) return;

    const firstService = services[0]?._id;
    const firstStaff = allStaff[0]?._id || 'st1';
    const secondStaff = allStaff.find((s: any) => s._id !== firstStaff)?._id || firstStaff;
    if (firstService) setSelectedServiceIds([firstService]);
    if (firstStaff) setSelectedStaffId(firstStaff);

    if (shot === 'booking') {
      setStep(1);
      return;
    }

    if (shot === 'group') {
      setIsGroupBooking(true);
      setCompanions([
        { guestName: 'نور', staffId: secondStaff },
        { guestName: 'ميا', staffId: firstStaff },
      ]);
      setStep(2);
      return;
    }

    if (shot === 'cash') {
      setSelectedSlot(storeDemoSlots[1] || storeDemoSlots[0]);
      setStep(4);
    }
  }, [services, allStaff]);

  useEffect(() => {
    if (step === 3) {
      fetchAvailability();
    }
  }, [step, selectedDate, selectedStaffId, selectedBranchId]);

  const fetchAvailability = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const serviceQuery = selectedServiceIds.join(',');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    dispatch(
      getAvailability({
        shopId: shop._id,
        dateStr,
        serviceQuery,
        staffId: selectedStaffId,
        timezone,
        branchId: selectedBranchId || undefined,
      })
    )
      .unwrap()
      .catch((error) => {
        Alert.alert(t('common.error'), error || t('booking.loadSlotsFailed'));
      });
  };

  const handleServiceToggle = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    const selected = services.filter(s => selectedServiceIds.includes(s._id));
    const price = selected.reduce((sum, s) => sum + s.price, 0);
    const duration = selected.reduce((sum, s) => sum + s.duration, 0);
    const bufferTime = selected.reduce((sum, s) => sum + (s.bufferTime || 0), 0);
    return { price, duration, bufferTime };
  };

  const calculateTotalWithDiscount = () => {
    const { price, duration, bufferTime } = calculateTotal();
    let discountAmount = 0;
    
    if (appliedCoupon) {
      discountAmount = (price * appliedCoupon.discountPercentage) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    }
    
    return { 
      originalPrice: price,
      discountAmount,
      finalPrice: Math.max(0, price - discountAmount),
      duration,
      bufferTime
    };
  };

  const handleApplyCoupon = (coupon: Coupon | null = null) => {
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
    } else {
      if (!couponCode.trim()) return;
      const found = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.shopId === shop._id);
      if (found) {
        if (found.status === 'used') {
          Alert.alert(t('common.error'), t('booking.couponAlreadyUsed'));
          return;
        }
        setAppliedCoupon(found);
        setCouponCode(found.code);
      } else {
        Alert.alert(t('common.error'), t('booking.invalidCoupon'));
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    
    try {
      setInternalBookingLoading(true);
      const { duration, bufferTime } = calculateTotal();
      const endTime = calculateEndTime(selectedSlot.time, duration + bufferTime);

      const dateStr = selectedDate.toISOString().split('T')[0];

      if (isGroupBooking && companions.length > 0) {
        if (companions.some((c) => !c.staffId)) {
          Alert.alert('تنبيه', 'اختاري موظفاً لكل مرافق');
          setInternalBookingLoading(false);
          return;
        }
        const members = [
          { staffId: selectedSlot.staffId, serviceIds: selectedServiceIds, guestName: 'أنا' },
          ...companions.map((c) => ({
            staffId: c.staffId,
            serviceIds: selectedServiceIds,
            guestName: c.guestName,
          })),
        ];
        const groupRes = await dispatch(
          createGroupBooking({
            shopId: shop._id,
            branchId: selectedBranchId || undefined,
            date: dateStr,
            startTime: selectedSlot.time,
            endTime,
            members,
          })
        ).unwrap();
        navigation.replace('BookingSuccess', { bookingId: groupRes.bookings?.[0]?._id || groupRes.groupId });
      } else {
        const bookingData = {
          shopId: shop._id,
          branchId: selectedBranchId || undefined,
          serviceIds: selectedServiceIds,
          staffId: selectedSlot.staffId,
          date: dateStr,
          startTime: selectedSlot.time,
          endTime: endTime,
          paymentMethod: 'cash',
          couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
        };
        const bookRes = await dispatch(createNewBooking(bookingData)).unwrap();
        navigation.replace('BookingSuccess', { bookingId: bookRes._id });
      }

      try {
        const NotificationManager = (await import('../utils/NotificationManager')).default;
        await NotificationManager.scheduleLocalReminder(
          'تم استلام حجزك',
          `موعدك في ${shop.name} الساعة ${selectedSlot.time}`,
          2,
          { screen: 'Bookings' }
        );
      } catch {
        // non-blocking
      }

    } catch (error: any) {
      Alert.alert(t('booking.bookingFailed'), typeof error === 'string' ? error : error.message || t('booking.slotTaken'));
      fetchAvailability();
      setStep(3); // Go back to slot selection
    } finally {
      setInternalBookingLoading(false);
    }
  };

  // UI Components
  const StepIndicator = () => (
    <View className="flex-row items-center justify-center px-3 mb-3">
      {[1, 2, 3, 4].map((s) => (
        <React.Fragment key={s}>
          <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= s ? 'bg-primary' : 'bg-gray-lighter'}`}>
            {step > s ? (
              <CheckCircle2 size={16} color="#FFF" />
            ) : (
              <Text className={`font-figtree-bold text-sm ${step === s ? 'text-white' : 'text-gray-medium'}`}>{s}</Text>
            )}
          </View>
          {s < 4 && (
            <View className={`flex-1 h-1 mx-2 rounded-full ${step > s ? 'bg-primary' : 'bg-gray-lighter'}`} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  const { originalPrice, discountAmount, finalPrice, duration } = calculateTotalWithDiscount();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-3 bg-background relative z-10">
        <TouchableOpacity 
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-lighter"
        >
          <ChevronLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-figtree-bold text-lg text-black-main">
          {step === 1 ? t('booking.selectServices') : step === 2 ? t('booking.dateAndProfessional') : step === 3 ? t('booking.chooseTime') : t('booking.confirmStep')}
        </Text>
        <View className="w-10" />
      </View>

      <StepIndicator />

      {/* Step 1: Services */}
      {step === 1 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
          <ServicesStep
            services={services}
            selectedServiceIds={selectedServiceIds}
            handleServiceToggle={handleServiceToggle}
            currency={currency}
          />

          {selectedServiceIds.length > 0 && (
            <Animated.View entering={FadeIn} className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/90 border-t border-gray-lighter" style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-figtree-medium text-[11px] text-gray-dark uppercase tracking-widest mb-1">{selectedServiceIds.length} {t('booking.selected')}</Text>
                  <Text className="font-figtree-bold text-xl text-black-main">{currency}{originalPrice} <Text className="font-figtree-regular text-sm text-gray-dark">({duration} {t('common.minutes')})</Text></Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setStep(2)}
                  className="bg-primary px-8 h-14 rounded-full flex-row items-center justify-center"
                >
                  <Text className="font-figtree-bold text-white text-base mr-2">{t('common.continue')}</Text>
                  <ArrowRight size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* Step 2: Date & Professional */}
      {step === 2 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
          <StaffDateStep
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
            branches={branches}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            isGroupBooking={isGroupBooking}
            setIsGroupBooking={setIsGroupBooking}
            companions={companions}
            setCompanions={setCompanions}
          />
          
          <View className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/90 border-t border-gray-lighter" style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }}>
            <TouchableOpacity 
              onPress={() => setStep(3)}
              className="bg-primary w-full h-14 rounded-full flex-row items-center justify-center"
            >
              <Text className="font-figtree-bold text-white text-base mr-2">{t('booking.findAvailability')}</Text>
              <ArrowRight size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Step 3: Time Slot */}
      {step === 3 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
          <TimeSlotsStep
            bookingFlowLoading={bookingFlowLoading}
            availableSlots={availableSlots}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            selectedStaffId={selectedStaffId}
            colors={colors}
          />

          {selectedSlot && (
            <Animated.View entering={FadeIn} className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/90 border-t border-gray-lighter" style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }}>
               <TouchableOpacity 
                onPress={() => setStep(4)}
                className="bg-primary w-full h-14 rounded-full flex-row items-center justify-center"
              >
                <Text className="font-figtree-bold text-white text-base mr-2">{t('booking.reviewBooking')}</Text>
                <ArrowRight size={18} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
          <ConfirmationStep
            shop={shop}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            services={services}
            selectedServiceIds={selectedServiceIds}
            currency={currency}
            appliedCoupon={appliedCoupon}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            handleApplyCoupon={handleApplyCoupon}
            handleRemoveCoupon={handleRemoveCoupon}
            coupons={coupons}
            originalPrice={originalPrice}
            discountAmount={discountAmount}
            finalPrice={finalPrice}
            colors={colors}
          />

          <View className="absolute bottom-0 left-0 right-0 px-3 pt-4 bg-white/90 border-t border-gray-lighter" style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }}>
             <TouchableOpacity 
              onPress={handleConfirm}
              disabled={internalBookingLoading}
              className={`w-full h-14 rounded-full flex-row items-center justify-center ${internalBookingLoading ? 'bg-primary/50' : 'bg-primary'}`}
            >
              {internalBookingLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text className="font-figtree-bold text-white text-lg mr-2">{t('booking.confirmBooking')}</Text>
                  <CheckCircle2 size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

    </View>
  );
}
