import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Banknote,
  History,
  X,
  Check,
  Building
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchWithdrawals, 
  fetchOwedBalances, 
  fetchPayoutHistory, 
  approveWithdrawal, 
  createPayout, 
  clearFinanceError,
  Withdrawal,
  WalletBalance
} from '@/store/slices/financeSlice';
import { fetchSettings } from '@/store/slices/settingSlice';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';
import { formatMoney } from '@/utils/helper';

const colors = twConfig.theme.extend.colors;

const TABS = [
  { id: 'withdrawals', label: 'بانتظار السحب', icon: Wallet },
  { id: 'owed', label: 'المستحقات', icon: Banknote },
  { id: 'history', label: 'السجل', icon: History },
];

const AdminFinancesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { withdrawals, owedBalances, payoutHistory, loading, error, actionLoading, actionError } = useAppSelector(state => state.finance);
  const { settings } = useAppSelector(state => state.settings);
  
  const currency = settings?.currency || 'ل.س';

  const sortedWithdrawals = useMemo(() => {
    return [...withdrawals].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [withdrawals]);

  const [activeTab, setActiveTab] = useState('withdrawals');
  
  // Modals state
  const [withdrawalModal, setWithdrawalModal] = useState<{ visible: boolean; data: Withdrawal | null }>({ visible: false, data: null });
  const [payoutModal, setPayoutModal] = useState<{ visible: boolean; data: WalletBalance | null }>({ visible: false, data: null });
  
  const [adminNote, setAdminNote] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const loadData = () => {
    dispatch(fetchSettings());
    dispatch(fetchWithdrawals());
    dispatch(fetchOwedBalances());
    dispatch(fetchPayoutHistory());
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (actionError) {
      Alert.alert(t('common.actionFailed'), actionError);
      dispatch(clearFinanceError());
    }
  }, [actionError, dispatch]);

  const handleApproveWithdrawal = async (status: 'approved' | 'rejected') => {
    if (!withdrawalModal.data) return;
    
    if (status === 'rejected' && !adminNote.trim()) {
      Alert.alert(t('common.validation'), t('adminScreens.rejectWithdrawalNoteRequired'));
      return;
    }

    const res = await dispatch(approveWithdrawal({ 
      id: withdrawalModal.data._id, 
      status, 
      adminNote: adminNote || undefined 
    }));

    if (approveWithdrawal.fulfilled.match(res)) {
      setWithdrawalModal({ visible: false, data: null });
      setAdminNote('');
      // Refresh balances and history as well
      dispatch(fetchOwedBalances());
      dispatch(fetchPayoutHistory());
    }
  };

  const handleCreatePayout = async () => {
    if (!payoutModal.data) return;

    const amount = Number(payoutAmount);
    const maxBalance = Number(payoutModal.data.balance || 0);
    if (!Number.isFinite(amount) || amount <= 0 || amount > maxBalance) {
      Alert.alert(t('common.validation'), `${t('adminScreens.validAmountUpTo')} ${formatMoney(maxBalance, currency)}`);
      return;
    }

    const res = await dispatch(createPayout({
      ownerId: payoutModal.data.ownerId._id,
      amount,
      referenceId: referenceId || undefined,
      adminNote: adminNote || undefined
    }));

    if (createPayout.fulfilled.match(res)) {
      setPayoutModal({ visible: false, data: null });
      setPayoutAmount('');
      setReferenceId('');
      setAdminNote('');
      // Refresh balances
      dispatch(fetchOwedBalances());
    }
  };

  const openPayoutModal = (item: WalletBalance) => {
    setPayoutModal({ visible: true, data: item });
    setPayoutAmount(String(Number(item.balance || 0)));
  };

  const getStatusLabel = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'بانتظار';
      case 'approved': return 'موافق عليه';
      case 'completed': return 'مكتمل';
      case 'rejected': return 'مرفوض';
      default: return status || 'غير معروف';
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'text-success bg-success-light';
      case 'completed': return 'text-success bg-success-light';
      case 'rejected': return 'text-error bg-error-light';
      default: return 'text-warning bg-warning-light';
    }
  };

  const renderWithdrawal = ({ item }: { item: Withdrawal }) => (
    <TouchableOpacity 
      onPress={() => item.status === 'pending' && setWithdrawalModal({ visible: true, data: item })}
      disabled={item.status !== 'pending'}
      className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-figtree-bold text-lg text-black-main">{formatMoney(item.amount, currency)}</Text>
          <Text className="font-figtree-medium text-gray-dark">{item.ownerId?.name || 'مالكة غير معروفة'}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status).split(' ')[1]}`}>
          <Text className={`font-figtree-semibold text-xs ${getStatusColor(item.status).split(' ')[0]}`}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="font-figtree-regular text-xs text-gray-medium">
          طلب: {dayjs(item.createdAt).format('D MMM YYYY h:mm A')}
        </Text>
        {item.status === 'pending' && (
          <Text className="font-figtree-bold text-xs text-primary">اضغطي للمراجعة</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderOwedBalance = ({ item }: { item: WalletBalance }) => (
    <View className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
            <Building size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-figtree-bold text-base text-black-main">{item.ownerId?.name || 'مالكة غير معروفة'}</Text>
            <Text className="font-figtree-regular text-xs text-gray-medium">{item.ownerId?.email}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="font-figtree-bold text-lg text-error">{formatMoney(item.balance, currency)}</Text>
          <Text className="font-figtree-regular text-xs text-gray-medium">مستحق</Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => openPayoutModal(item)}
        className="w-full gap-1 py-3 bg-white rounded-xl border border-gray-lighter flex-row items-center justify-center shadow-sm shadow-black/5"
      >
        <Banknote size={16} color={colors['black-main']} className="mr-2" />
        <Text className="font-figtree-semibold text-black-main">تسجيل دفع</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPayout = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-figtree-bold text-lg text-success">{formatMoney(item.amount, currency)}</Text>
          <Text className="font-figtree-medium text-gray-dark">{item.ownerId?.name || 'مالكة غير معروفة'}</Text>
        </View>
        <Text className="font-figtree-regular text-xs text-gray-medium">
          {dayjs(item.createdAt).format('D MMM YYYY')}
        </Text>
      </View>
      {item.referenceId && (
        <Text className="font-figtree-regular text-xs text-gray-medium mt-1">مرجع: {item.referenceId}</Text>
      )}
      {item.adminNote && (
        <Text className="font-figtree-regular text-xs text-gray-medium mt-1 italic">ملاحظة: {item.adminNote}</Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-1 bg-background z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
        >
          <ArrowLeft size={20} color={colors['black-main']} />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-xl text-black-main">المالية</Text>
      </View>

      {/* Modern Segmented Control Tabs */}
      <View className="px-3 py-2 mb-0">
        <View className="flex-row bg-gray-100/80 p-1.5 rounded-full border border-gray-200/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
                className={`flex-1 gap-1 flex-row items-center justify-center py-2 rounded-full ${
                  isActive ? 'bg-white' : 'bg-transparent'
                }`}
              >
                <Icon size={14} color={isActive ? colors.primary : colors.gray.medium} className="mr-1.5" />
                <Text className={`font-figtree-bold text-xs ${isActive ? 'text-primary' : 'text-gray-medium'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={
            (activeTab === 'withdrawals' ? sortedWithdrawals :
            activeTab === 'owed' ? owedBalances :
            payoutHistory) as any[]
          }
          keyExtractor={(item) => item._id}
          renderItem={
            activeTab === 'withdrawals' ? renderWithdrawal as any :
            activeTab === 'owed' ? renderOwedBalance as any :
            renderPayout as any
          }
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="font-figtree-medium text-gray-medium">
                {activeTab === 'withdrawals'
                  ? 'لا توجد طلبات سحب.'
                  : activeTab === 'owed'
                    ? 'لا توجد مستحقات حالياً.'
                    : 'لا يوجد سجل مدفوعات.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Review Withdrawal Modal */}
      <Modal visible={withdrawalModal.visible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-[32px] p-5 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}>
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-figtree-bold text-xl text-black-main">مراجعة السحب</Text>
              <TouchableOpacity onPress={() => setWithdrawalModal({ visible: false, data: null })} className="p-2">
                <X size={20} color={colors['black-main']} />
              </TouchableOpacity>
            </View>

            {withdrawalModal.data && (
              <>
                <View className="bg-white p-4 rounded-2xl border border-gray-lighter mb-4">
                  <Text className="font-figtree-regular text-sm text-gray-medium mb-1">المبلغ المطلوب</Text>
                  <Text className="font-figtree-bold text-3xl text-black-main mb-3">
                    {formatMoney(withdrawalModal.data.amount, currency)}
                  </Text>
                  <Text className="font-figtree-regular text-sm text-gray-medium mb-1">المالكة</Text>
                  <Text className="font-figtree-semibold text-black-main mb-3">
                    {withdrawalModal.data.ownerId?.name}
                  </Text>
                  <Text className="font-figtree-regular text-sm text-gray-medium mb-1">تفاصيل الحساب / التحويل</Text>
                  <View className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                    <Text className="font-figtree-semibold text-gray-dark">
                      {withdrawalModal.data.payoutDetails || 'لا توجد تفاصيل'}
                    </Text>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="font-figtree-semibold text-sm text-gray-dark mb-2">ملاحظة الأدمن (مطلوبة عند الرفض)</Text>
                  <TextInput
                    value={adminNote}
                    onChangeText={setAdminNote}
                    placeholder="سبب الرفض أو مرجع التحويل..."
                    placeholderTextColor={colors.gray.lighter}
                    multiline
                    numberOfLines={3}
                    className="w-full bg-white rounded-2xl border border-gray-lighter p-4 font-figtree-medium text-black-main text-base min-h-[100px]"
                    textAlignVertical="top"
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={() => handleApproveWithdrawal('rejected')}
                    disabled={actionLoading}
                    className="flex-1 py-4 bg-error-light border border-error/20 rounded-2xl items-center justify-center flex-row"
                  >
                    <XCircle size={18} color={colors.error.DEFAULT} className="mr-2" />
                    <Text className="font-figtree-bold text-error text-base">رفض</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleApproveWithdrawal('approved')}
                    disabled={actionLoading}
                    className="flex-1 py-4 bg-success rounded-2xl items-center justify-center flex-row shadow-lg shadow-success/30"
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color={colors.white} className="mr-2" />
                        <Text className="font-figtree-bold text-white text-base">موافقة</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manual Payout Modal */}
      <Modal visible={payoutModal.visible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-[32px] p-5 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}>
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-figtree-bold text-xl text-black-main">تسجيل دفع</Text>
              <TouchableOpacity onPress={() => setPayoutModal({ visible: false, data: null })} className="p-2">
                <X size={20} color={colors['black-main']} />
              </TouchableOpacity>
            </View>

            {payoutModal.data && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-error-light p-4 rounded-2xl border border-error/20 mb-4">
                  <Text className="font-figtree-regular text-sm text-error mb-1">إجمالي المستحق</Text>
                  <Text className="font-figtree-bold text-2xl text-error">
                    {formatMoney(payoutModal.data.balance, currency)}
                  </Text>
                  <Text className="font-figtree-semibold text-error mt-2 text-sm">
                    {payoutModal.data.ownerId?.name}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="font-figtree-semibold text-sm text-gray-dark mb-2 ml-1">مبلغ الدفع *</Text>
                  <View className="relative">
                    <Text className="absolute left-4 top-[15px] font-figtree-bold text-gray-medium text-base z-10">{currency || 'ل.س'}</Text>
                    <TextInput
                      value={payoutAmount}
                      onChangeText={setPayoutAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.gray.lighter}
                      className="w-full bg-white rounded-2xl border border-gray-lighter pl-8 pr-4 h-14 font-figtree-bold text-black-main text-base"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="font-figtree-semibold text-sm text-gray-dark mb-2 ml-1">مرجع التحويل</Text>
                  <TextInput
                    value={referenceId}
                    onChangeText={setReferenceId}
                    placeholder="مثال: TXN-123456789"
                    placeholderTextColor={colors.gray.lighter}
                    className="w-full bg-white rounded-2xl border border-gray-lighter px-4 h-14 font-figtree-medium text-black-main text-base"
                  />
                </View>

                <View className="mb-6">
                  <Text className="font-figtree-semibold text-sm text-gray-dark mb-2 ml-1">ملاحظة الأدمن</Text>
                  <TextInput
                    value={adminNote}
                    onChangeText={setAdminNote}
                    placeholder="ملاحظة داخلية..."
                    placeholderTextColor={colors.gray.lighter}
                    className="w-full bg-white rounded-2xl border border-gray-lighter p-4 font-figtree-medium text-black-main text-base min-h-[80px]"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity 
                  onPress={handleCreatePayout}
                  disabled={actionLoading}
                  className={`w-full py-4 rounded-2xl items-center justify-center flex-row ${actionLoading ? 'bg-primary/50' : 'bg-primary shadow-lg shadow-primary/30'}`}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Check size={20} color={colors.white} className="mr-2" />
                      <Text className="font-figtree-bold text-white text-lg">تسجيل الدفع</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

export default AdminFinancesScreen;
