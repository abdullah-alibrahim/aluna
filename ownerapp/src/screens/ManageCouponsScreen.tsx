import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Ticket,
  Calendar,
  Percent,
  Hash,
  X,
  Clock,
  DollarSign
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  clearCouponError,
  Coupon,
} from '@/store/slices/couponSlice';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';

import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';
const colors = twConfig.theme.extend.colors;

export default function ManageCouponsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const shop = route.params?.shop;
  const dispatch = useAppDispatch();

  const { coupons, loading, actionLoading, error } = useAppSelector((state) => state.coupons);

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [isActive, setIsActive] = useState(true);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['90%'], []);

  useEffect(() => {
    if (shop?._id) {
      dispatch(fetchCoupons(shop._id));
    }
  }, [dispatch, shop]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
      dispatch(clearCouponError());
    }
  }, [error]);

  const openSheet = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setCode(coupon.code);
      setDiscountPercentage(coupon.discountPercentage.toString());
      setMaxDiscount(coupon.maxDiscount ? coupon.maxDiscount.toString() : '');
      setExpiryDate(dayjs(coupon.expiryDate).format('YYYY-MM-DD'));
      setUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : '');
      setIsActive(coupon.isActive);
    } else {
      setSelectedCoupon(null);
      setCode('');
      setDiscountPercentage('');
      setMaxDiscount('');
      setExpiryDate('');
      setUsageLimit('');
      setIsActive(true);
    }
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const handleSave = async () => {
    if (!code || !discountPercentage || !expiryDate) {
      Alert.alert(t('common.validationError'), t('coupons.missingFields'));
      return;
    }

    const data: Partial<Coupon> = {
      code,
      discountPercentage: Number(discountPercentage),
      expiryDate: new Date(expiryDate).toISOString(),
      isActive,
    };
    if (maxDiscount) data.maxDiscount = Number(maxDiscount);
    if (usageLimit) data.usageLimit = Number(usageLimit);

    try {
      if (selectedCoupon) {
        await dispatch(updateCoupon({ shopId: shop._id, couponId: selectedCoupon._id, data })).unwrap();
      } else {
        await dispatch(createCoupon({ shopId: shop._id, data })).unwrap();
      }
      closeSheet();
    } catch (e) {
      // Error is handled by useEffect
    }
  };

  const handleDelete = (coupon: Coupon) => {
    Alert.alert(
      t('coupons.deleteTitle'),
      t('coupons.deleteConfirm').replace('{code}', coupon.code),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: () => dispatch(deleteCoupon({ shopId: shop._id, couponId: coupon._id }))
        }
      ]
    );
  };

  const handleToggleActive = async (coupon: Coupon, newValue: boolean) => {
    try {
      await dispatch(updateCoupon({ shopId: shop._id, couponId: coupon._id, data: { isActive: newValue } })).unwrap();
    } catch (e) {
      // Error handled by global error state
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const renderCouponItem = ({ item }: { item: Coupon }) => {
    const isExpired = dayjs(item.expiryDate).isBefore(dayjs());
    const isExhausted = item.usageLimit && item.usedCount >= item.usageLimit;
    const statusColor = (!item.isActive || isExpired || isExhausted) ? colors.error.DEFAULT : colors.success.DEFAULT;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-lighter shadow-sm shadow-black/5">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ticket size={20} color="#B59451" />
            </View>
            <View>
              <Text className="font-figtree-bold text-lg text-black-main">{item.code}</Text>
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: statusColor }} />
                <Text className="font-figtree-medium text-xs text-gray-medium">
                  {!item.isActive ? t('coupons.inactive') : isExpired ? t('coupons.expired') : isExhausted ? t('coupons.fullyUsed') : t('coupons.active')}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => openSheet(item)} className="p-2 bg-gray-100 rounded-full mr-2">
              <Edit2 size={16} color={colors['black-main']} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} className="p-2 bg-red-50 rounded-full">
              <Trash2 size={16} color={colors.error.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap mt-2 pt-3 border-t border-gray-lighter">
          <View className="w-1/2 gap-1 mb-2 flex-row items-center">
            <Percent size={14} color={colors['gray-medium']} className="mr-1.5" />
            <Text className="font-figtree-medium text-sm text-black-main">{item.discountPercentage}% {t('coupons.off')}</Text>
          </View>
          <View className="w-1/2 gap-1 mb-2 flex-row items-center">
            <Calendar size={14} color={colors['gray-medium']} className="mr-1.5" />
            <Text className="font-figtree-medium text-sm text-black-main">{t('coupons.ends')} {dayjs(item.expiryDate).format('MMM D, YY')}</Text>
          </View>
          <View className="w-1/2 gap-1 flex-row items-center">
            <Hash size={14} color={colors['gray-medium']} className="mr-1.5" />
            <Text className="font-figtree-medium text-sm text-black-main">{t('coupons.uses')} {item.usedCount} {item.usageLimit ? `/ ${item.usageLimit}` : t('coupons.unlimited')}</Text>
          </View>
          {item.maxDiscount && (
            <View className="w-1/2 gap-1 flex-row items-center">
              <DollarSign size={14} color={colors['gray-medium']} className="mr-1.5" />
              <Text className="font-figtree-medium text-sm text-black-main">{t('coupons.max')} {t('common.currency')}{item.maxDiscount}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="px-3 flex-row items-center justify-between bg-background"
        style={{ paddingTop: insets.top, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft color="#14110A" size={24} />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-xl text-black-main">{t('coupons.title')}</Text>
        <TouchableOpacity 
          onPress={() => openSheet()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-primary/10"
        >
          <Plus color="#B59451" size={24} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading && !coupons.length ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B59451" />
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={item => item._id}
          renderItem={renderCouponItem}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 80 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-3">
              <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
                <Ticket color="#B59451" size={40} />
              </View>
              <Text className="font-figtree-bold text-xl text-black-main text-center mb-2">{t('coupons.emptyTitle')}</Text>
              <Text className="font-figtree-regular text-gray-medium text-center text-sm leading-6 mb-6">
                {t('coupons.emptyHint')}
              </Text>
              <TouchableOpacity 
                onPress={() => openSheet()}
                className="bg-primary px-6 py-3 rounded-full flex-row items-center"
              >
                <Plus color="#FFFFFF" size={20} className="mr-2" />
                <Text className="font-figtree-bold text-white text-base">{t('coupons.create')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bottom Sheet for Create / Edit */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#F9F5EB', borderRadius: 32 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <BottomSheetScrollView 
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row justify-between items-center mb-3 mt-2">
              <Text className="font-figtree-bold text-2xl text-black-main">
                {selectedCoupon ? t('coupons.edit') : t('coupons.new')}
              </Text>
              <TouchableOpacity onPress={closeSheet} className="w-8 h-8 items-center justify-center bg-black/5 rounded-full">
                <X color="#14110A" size={20} />
              </TouchableOpacity>
            </View>

            {/* Code */}
            <View className="mb-3">
              <Text className="font-figtree-medium text-sm text-gray-medium mb-2">{t('coupons.code')}</Text>
              <View className="bg-white rounded-full px-3 py-1 border border-gray-lighter flex-row items-center">
                <Ticket color="#A0A0A0" size={20} className="mr-3" />
                <TextInput
                  value={code}
                  onChangeText={text => setCode(text.toUpperCase())}
                  placeholder={t('coupons.codePlaceholder')}
                  className="flex-1 font-figtree-medium text-base text-black-main"
                  placeholderTextColor="#A0A0A0"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Is Active Toggle */}
            <View className="bg-white rounded-2xl p-3 border border-gray-lighter flex-row items-center justify-between mt-0 mb-4">
              <View>
                <Text className="font-figtree-bold text-base text-black-main">{t('coupons.activeStatus')}</Text>
                <Text className="font-figtree-regular text-xs text-gray-medium mt-0.5">{t('coupons.activeHint')}</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Discount Percentage */}
            <View className="mb-3">
              <Text className="font-figtree-medium text-sm text-gray-medium mb-2">{t('coupons.discountPercent')}</Text>
              <View className="bg-white rounded-full px-3 py-1 border border-gray-lighter flex-row items-center">
                <Percent color="#A0A0A0" size={20} className="mr-3" />
                <TextInput
                  value={discountPercentage}
                  onChangeText={setDiscountPercentage}
                  placeholder="مثال: 20"
                  className="flex-1 font-figtree-medium text-base text-black-main"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Max Discount */}
            <View className="mb-3">
              <Text className="font-figtree-medium text-sm text-gray-medium mb-2">{t('coupons.maxDiscount')}</Text>
              <View className="bg-white rounded-full px-3 py-1 border border-gray-lighter flex-row items-center">
                <DollarSign color="#A0A0A0" size={20} className="mr-3" />
                <TextInput
                  value={maxDiscount}
                  onChangeText={setMaxDiscount}
                  placeholder="مثال: 50"
                  className="flex-1 font-figtree-medium text-base text-black-main"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Expiry Date */}
            <View className="mb-3">
              <Text className="font-figtree-medium text-sm text-gray-medium mb-2">{t('coupons.expiryDate')}</Text>
              <View className="bg-white rounded-full px-3 py-1 border border-gray-lighter flex-row items-center">
                <Calendar color="#A0A0A0" size={20} className="mr-3" />
                <TextInput
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="مثال: 2026-12-31"
                  className="flex-1 font-figtree-medium text-base text-black-main"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            {/* Usage Limit */}
            <View className="mb-3">
              <Text className="font-figtree-medium text-sm text-gray-medium mb-2">{t('coupons.usageLimit')}</Text>
              <View className="bg-white rounded-full px-3 py-1 border border-gray-lighter flex-row items-center">
                <Hash color="#A0A0A0" size={20} className="mr-3" />
                <TextInput
                  value={usageLimit}
                  onChangeText={setUsageLimit}
                  placeholder="مثال: 100"
                  className="flex-1 font-figtree-medium text-base text-black-main"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                />
              </View>
            </View>



            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={actionLoading}
              className={`bg-black-main py-4 rounded-full items-center justify-center shadow-lg shadow-black/20 ${actionLoading ? 'opacity-70' : ''}`}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-figtree-bold text-lg text-white">{t('common.save')}</Text>
              )}
            </TouchableOpacity>

          </BottomSheetScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}
