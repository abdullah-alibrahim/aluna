import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, CalendarDays, User, Ticket, Percent, X, Banknote } from 'lucide-react-native';
import { formatTime12h, formatMoney } from '@/utils/helper';
import { Coupon } from '@/store/slices/couponSlice';
import { t } from '@/i18n';

interface ConfirmationStepProps {
  shop: any;
  selectedDate: Date;
  selectedSlot: any;
  services: any[];
  selectedServiceIds: string[];
  currency: string;
  appliedCoupon: Coupon | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  handleApplyCoupon: (coupon?: Coupon) => void;
  handleRemoveCoupon: () => void;
  coupons: Coupon[];
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  colors: any;
}

export default function ConfirmationStep({
  shop,
  selectedDate,
  selectedSlot,
  services,
  selectedServiceIds,
  currency,
  appliedCoupon,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  coupons,
  originalPrice,
  discountAmount,
  finalPrice,
  colors,
}: ConfirmationStepProps) {
  return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
      
      <View className="bg-white p-5 rounded-[32px] border border-gray-lighter mb-3">
        <View className="items-center mb-3">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Percent size={36} color={colors.primary} />
          </View>
          <Text className="font-figtree-bold text-2xl text-black-main mb-1">{t('booking.bookingSummary')}</Text>
          <Text className="font-figtree-medium text-gray-dark">{t('booking.reviewDetails')}</Text>
        </View>

        <View className="space-y-4 mb-3">
          <View className="flex-row items-start py-3 border-b border-gray-lighter">
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
              <MapPin size={18} color={colors['black-main']} />
            </View>
            <View className="flex-1">
              <Text className="font-figtree-medium text-xs text-gray-medium uppercase tracking-wider mb-1">{t('booking.shop')}</Text>
              <Text className="font-figtree-bold text-base text-black-main">{shop.name}</Text>
              <Text className="font-figtree-medium text-sm text-gray-dark">{shop.address}</Text>
            </View>
          </View>

          <View className="flex-row items-start py-3 border-b border-gray-lighter">
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
              <CalendarDays size={18} color={colors['black-main']} />
            </View>
            <View className="flex-1">
              <Text className="font-figtree-medium text-xs text-gray-medium uppercase tracking-wider mb-1">{t('booking.dateTime')}</Text>
              <Text className="font-figtree-bold text-base text-black-main">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text className="font-figtree-medium text-primary text-sm mt-1">{selectedSlot ? formatTime12h(selectedSlot.time) : ''}</Text>
            </View>
          </View>

          <View className="flex-row items-start py-3 border-b border-gray-lighter">
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
              <User size={18} color={colors['black-main']} />
            </View>
            <View className="flex-1">
              <Text className="font-figtree-medium text-xs text-gray-medium uppercase tracking-wider mb-1">{t('booking.professional')}</Text>
              <Text className="font-figtree-bold text-base text-black-main">{selectedSlot?.staffName}</Text>
            </View>
          </View>

          <View className="py-3">
            <Text className="font-figtree-medium text-xs text-gray-medium uppercase tracking-wider mb-3">{t('booking.services')}</Text>
            {services.filter(s => selectedServiceIds.includes(s._id)).map(s => (
              <View key={s._id} className="flex-row justify-between items-center mb-2">
                <Text className="font-figtree-medium text-sm text-black-main flex-1">{s.name}</Text>
                <Text className="font-figtree-bold text-sm text-black-main">{formatMoney(s.price, currency)}</Text>
              </View>
            ))}
            
            {/* Promo Code */}
            <View className="mt-4 pt-4 border-t border-gray-lighter">
              <Text className="font-figtree-medium text-xs text-gray-medium uppercase tracking-wider mb-2">{t('booking.promoCode')}</Text>
              
              {appliedCoupon ? (
                <View className="flex-row items-center justify-between border border-primary/30 rounded-2xl px-4 py-3 bg-primary/5">
                  <View className="flex-row items-center">
                    <View className="bg-primary/10 w-8 h-8 rounded-full items-center justify-center mr-3">
                      <Percent size={14} color={colors.primary} />
                    </View>
                    <View>
                      <Text className="font-figtree-bold text-sm text-primary">{appliedCoupon.code}</Text>
                      <Text className="font-figtree-medium text-xs text-primary/70">{appliedCoupon.discountPercentage}% {t('coupons.off')}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemoveCoupon} className="p-1">
                    <X size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center border border-gray-lighter rounded-2xl px-3 py-1 bg-gray-50">
                  <Ticket size={18} color="#A0A0A0" className="mr-2" />
                  <TextInput
                    value={couponCode}
                    onChangeText={text => setCouponCode(text.toUpperCase())}
                    placeholder={t('booking.enterCode')}
                    className="flex-1 font-figtree-medium text-sm text-black-main py-2"
                    placeholderTextColor="#A0A0A0"
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity 
                    onPress={() => handleApplyCoupon()}
                    disabled={!couponCode.trim()}
                    className={`px-4 py-1.5 rounded-xl ml-2 ${couponCode.trim() ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <Text className="font-figtree-bold text-white text-xs">{t('common.apply')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!appliedCoupon && coupons.filter(c => c.shopId === shop._id && c.status === 'collected').length > 0 && (
                <View className="mt-3">
                  <Text className="font-figtree-medium text-xs text-gray-medium mb-2">{t('booking.availableInWallet')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {coupons.filter(c => c.shopId === shop._id && c.status === 'collected').map(coupon => (
                      <TouchableOpacity 
                        key={coupon._id}
                        onPress={() => handleApplyCoupon(coupon)}
                        className="border border-gray-lighter rounded-xl p-3 mr-3 bg-white w-48 flex-row items-center"
                      >
                        <View className="bg-green-50 w-8 h-8 rounded-full items-center justify-center mr-3">
                          <Percent size={14} color="#10B981" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-figtree-bold text-sm text-black-main">{coupon.code}</Text>
                          <Text className="font-figtree-medium text-xs text-gray-dark">{coupon.discountPercentage}% {t('coupons.off')}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View className="mt-4 pt-4 border-t border-gray-lighter space-y-2">
              {discountAmount > 0 && (
                <>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-figtree-medium text-sm text-gray-dark">{t('common.subtotal')}</Text>
                    <Text className="font-figtree-medium text-sm text-gray-dark">{formatMoney(originalPrice, currency)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-figtree-medium text-sm text-primary">{t('common.discount')}</Text>
                    <Text className="font-figtree-medium text-sm text-primary">-{formatMoney(discountAmount, currency)}</Text>
                  </View>
                </>
              )}
              <View className="flex-row justify-between items-center pt-2">
                <Text className="font-figtree-bold text-lg text-black-main">{t('common.total')}</Text>
                <Text className="font-figtree-bold text-2xl text-primary">{formatMoney(finalPrice, currency)}</Text>
              </View>
            </View>

            {shop?.requiresDeposit && (
              <View className="mt-4 p-4 rounded-2xl bg-warning/10 border border-warning/30">
                <Text className="font-figtree-bold text-sm text-black-main mb-1">{t('booking.depositPolicy')}</Text>
                <Text className="font-figtree-medium text-xs text-gray-dark mb-2">{t('booking.depositRequired')}</Text>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-figtree-medium text-sm text-gray-dark">{t('booking.depositAmount')}</Text>
                  <Text className="font-figtree-bold text-sm text-primary">
                    {formatMoney(Math.round(Number(finalPrice || 0) * ((shop.depositPercent ?? 20) / 100)), currency)}
                  </Text>
                </View>
                <Text className="font-figtree-regular text-xs text-gray-medium leading-5">{t('booking.depositHint')}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="mb-3">
          <Text className="font-figtree-bold text-lg text-black-main mb-3">طريقة الدفع</Text>
          
          <TouchableOpacity
            activeOpacity={1}
            className="flex-row items-center justify-between p-4 mb-1 rounded-2xl border border-primary bg-primary/5"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/20">
                <Banknote color={colors.primary} size={20} />
              </View>
              <View>
                <Text className="font-figtree-bold text-base text-primary">دفع نقدي في الصالون</Text>
                <Text className="font-figtree-medium text-xs text-gray-medium">كاش عند الحضور — الطريقة الوحيدة حالياً</Text>
              </View>
            </View>
            <View className="w-6 h-6 rounded-full border-2 border-primary items-center justify-center">
              <View className="w-3 h-3 rounded-full bg-primary" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
    </ScrollView>
  );
}
