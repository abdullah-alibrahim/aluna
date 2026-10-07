import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Ticket, Percent, Calendar, CheckCircle2 } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoupons, collectCoupon, Coupon } from '../store/slices/couponSlice';
import dayjs from 'dayjs';
import { t } from '@/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Coupons'>;

const CouponsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { coupons, loading, actionLoading } = useAppSelector(state => state.coupon);
  
  const [activeTab, setActiveTab] = useState<'available' | 'collected'>('available');

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const handleCollect = async (coupon: Coupon) => {
    try {
      await dispatch(collectCoupon(coupon._id)).unwrap();
      Alert.alert(t('common.success'), t('coupons.collectedSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error || t('coupons.collectFailed'));
    }
  };

  const availableCoupons = coupons.filter(c => c.status === 'available');
  const collectedCoupons = coupons.filter(c => c.status === 'collected');

  const displayedCoupons = activeTab === 'available' ? availableCoupons : collectedCoupons;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="px-3 flex-row items-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-white mr-3"
        >
          <ArrowLeft color="#14110A" size={24} />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-xl text-black-main">{t('coupons.title')}</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mt-0 mb-2">
        <TouchableOpacity 
          onPress={() => setActiveTab('available')}
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'available' ? 'border-primary' : 'border-transparent'}`}
        >
          <Text className={`font-figtree-bold ${activeTab === 'available' ? 'text-primary' : 'text-gray-medium'}`}>
            {t('coupons.exploreOffers')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('collected')}
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'collected' ? 'border-primary' : 'border-transparent'}`}
        >
          <Text className={`font-figtree-bold ${activeTab === 'collected' ? 'text-primary' : 'text-gray-medium'}`}>
            {t('coupons.myWallet')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchCoupons())} />}
      >
        {!loading && displayedCoupons.length === 0 && (
          <View className="items-center justify-center py-20 px-8">
            <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Ticket color="#B59451" size={40} />
            </View>
            <Text className="font-figtree-bold text-xl text-black-main mb-2 text-center">
              {activeTab === 'available' ? t('coupons.noNewOffers') : t('coupons.walletEmpty')}
            </Text>
            <Text className="font-figtree-medium text-sm text-gray-medium text-center">
              {activeTab === 'available' 
                ? t('coupons.noOffersHint')
                : t('coupons.walletEmptyHint')}
            </Text>
          </View>
        )}

        {displayedCoupons.map((item) => (
          <View key={item._id} className="bg-white rounded-3xl p-5 mb-4 shadow-sm shadow-black/5 border border-gray-lighter">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Percent size={24} color="#B59451" />
                </View>
                <View className="flex-1">
                  <Text className="font-figtree-bold text-xl text-black-main">{item.discountPercentage}% {t('coupons.off')}</Text>
                  <Text className="font-figtree-medium text-sm text-gray-medium mt-0.5">{t('coupons.code')} <Text className="text-black-main font-figtree-bold">{item.code}</Text></Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <Calendar size={14} color="#6B7280" className="mr-1.5" />
              <Text className="font-figtree-medium text-xs text-gray-medium">
                {t('coupons.validUntil')} {dayjs(item.expiryDate).format('MMM D, YYYY')}
              </Text>
            </View>

            {/* Divider */}
            <View className="border-t border-dashed border-gray-300 w-full mb-4" />

            {activeTab === 'available' ? (
              <TouchableOpacity 
                onPress={() => handleCollect(item)}
                disabled={actionLoading}
                className="bg-primary/10 py-3 rounded-full items-center justify-center"
              >
                {actionLoading ? (
                  <ActivityIndicator color="#B59451" />
                ) : (
                  <Text className="font-figtree-bold text-primary">{t('coupons.collectOffer')}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View className="bg-green-50 gap-1 py-3 rounded-full items-center justify-center flex-row">
                <CheckCircle2 size={16} color="#10B981" className="mr-2" />
                <Text className="font-figtree-bold text-green-600">{t('coupons.readyToUse')}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CouponsScreen;
