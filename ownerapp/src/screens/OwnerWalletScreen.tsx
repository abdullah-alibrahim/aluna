import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ArrowUpRight, History, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWallet, requestWithdrawal, WithdrawalRequest } from '@/store/slices/walletSlice';
import WalletCard from '@/components/WalletCard';
import { formatMoney } from '@/utils/helper';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const OwnerWalletScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { wallet, withdrawals, loading, actionLoading } = useAppSelector(state => state.wallet);
  const { user } = useAppSelector(state => state.auth);
  const { settings } = useAppSelector(state => state.settings);

  const currency = settings?.currency || t('common.currency');

  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  const handleWithdrawRequest = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setError(t('wallet.invalidAmount'));
      return;
    }
    if (wallet && amount > wallet.balance) {
      setError(t('wallet.exceedsBalance'));
      return;
    }
    if (!payoutDetails.trim()) {
      setError(t('wallet.payoutRequired'));
      return;
    }

    try {
      await dispatch(requestWithdrawal({ amount, payoutDetails })).unwrap();
      setModalVisible(false);
      setWithdrawAmount('');
      setPayoutDetails('');
      setError('');
    } catch (err: any) {
      setError(err || t('wallet.withdrawFailed'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved':
      case 'processed':
        return <CheckCircle size={20} color={colors.success.DEFAULT} />;
      case 'rejected':
        return <XCircle size={20} color={colors.error.DEFAULT} />;
      default:
        return <Clock size={20} color={colors.warning.DEFAULT} />;
    }
  };

  const renderWithdrawalItem = ({ item }: { item: WithdrawalRequest }) => (
    <View className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-gray-lighter shadow-sm shadow-black/5">
      <View className="w-12 h-12 rounded-full bg-background items-center justify-center mr-4">
        {getStatusIcon(item.status)}
      </View>
      <View className="flex-1">
        <Text className="font-figtree-bold text-base text-black-main">{t('wallet.withdrawal')}</Text>
        <Text className="font-figtree-medium text-xs text-gray-medium">{dayjs(item.createdAt).format('D MMM YYYY • h:mm A')}</Text>
      </View>
      <View className="items-end">
        <Text className="font-figtree-bold text-base text-black-main">-{Number(item.amount || 0).toLocaleString('ar-SY')} {currency}</Text>
        <Text className="font-figtree-medium text-xs" style={{ color: item.status === 'processed' || item.status === 'approved' ? colors.success.DEFAULT : item.status === 'rejected' ? colors.error.DEFAULT : colors.warning.DEFAULT }}>
          {item.status === 'pending' ? 'بانتظار' : item.status === 'approved' || item.status === 'processed' ? 'تمت الموافقة' : item.status === 'rejected' ? 'مرفوض' : item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="px-3 flex-row items-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-background border border-gray-lighter mr-3"
        >
          <ChevronLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="text-black-main font-figtree-bold text-xl">{t('wallet.title')}</Text>
      </View>

      {loading && !wallet ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={item => item._id}
          renderItem={renderWithdrawalItem}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="mb-3">
              {/* Card Section */}
              <View className="mb-3">
                <WalletCard 
                  balance={wallet?.balance || 0} 
                  ownerName={user?.name || 'مالكة'} 
                  currency={currency}
                />
              </View>

              {/* Actions Section */}
              <View className="flex-row justify-between mb-3">
                <TouchableOpacity 
                  onPress={() => setModalVisible(true)}
                  className="flex-1 flex-row items-center justify-center bg-primary p-3 rounded-2xl mr-2 shadow-sm shadow-primary/30"
                >
                  <ArrowUpRight size={20} color="#FFF" />
                  <Text className="font-figtree-bold text-white ml-2">{t('wallet.withdraw')}</Text>
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center justify-center bg-white border border-gray-lighter p-3 rounded-2xl ml-2 shadow-sm shadow-black/5">
                  <History size={20} color={colors.primary} />
                  <Text className="font-figtree-bold text-black-main ml-2">{t('wallet.history')}</Text>
                </View>
              </View>

              <Text className="font-figtree-bold text-lg text-black-main mb-0">{t('wallet.recentActivity')}</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <History size={48} color={colors['gray-lighter']} />
              <Text className="font-figtree-medium text-gray-medium mt-4">{t('wallet.noHistory')}</Text>
            </View>
          }
        />
      )}

      {/* Withdrawal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-[32px] p-5" style={{ paddingBottom: Math.max(insets.bottom + 20, 30) }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-figtree-bold text-2xl text-black-main">{t('wallet.withdrawFunds')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 items-center justify-center bg-background rounded-full">
                <XCircle size={20} color={colors['gray-dark']} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View className="bg-red-50 p-3 rounded-xl mb-3 border border-red-100">
                <Text className="text-red-500 font-figtree-medium text-sm text-center">{error}</Text>
              </View>
            ) : null}

            <View className="mb-3">
              <Text className="font-figtree-bold text-black-main text-sm mb-2">{t('wallet.amountToWithdraw')}</Text>
              <View className="flex-row items-center bg-background rounded-2xl border border-gray-lighter px-3 py-1">
                <Text className="font-figtree-bold text-gray-dark text-lg mr-1">{currency}</Text>
                <TextInput
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  className="font-figtree-bold text-black-main text-lg flex-1"
                />
              </View>
              <Text className="font-figtree-medium text-gray-medium text-xs mt-2 text-right">{t('wallet.available')} {formatMoney(wallet?.balance, currency)}</Text>
            </View>

            <View className="mb-3">
              <Text className="font-figtree-bold text-black-main text-sm mb-2">{t('wallet.payoutDetails')}</Text>
              <View className="bg-background rounded-2xl border border-gray-lighter px-4 py-3 h-24">
                <TextInput
                  value={payoutDetails}
                  onChangeText={setPayoutDetails}
                  placeholder={t('wallet.payoutPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  className="font-figtree-medium text-black-main text-base"
                  multiline
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleWithdrawRequest}
              disabled={actionLoading || !withdrawAmount || !payoutDetails}
              className={`flex-row items-center justify-center py-4 rounded-full ${(!withdrawAmount || !payoutDetails || actionLoading) ? 'bg-primary/50' : 'bg-primary'}`}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-figtree-bold text-white text-lg">{t('wallet.submitRequest')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

export default OwnerWalletScreen;
