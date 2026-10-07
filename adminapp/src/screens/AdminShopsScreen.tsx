import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  X,
  Clock,
  Star,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAllShops,
  updateShopStatus,
  clearShopError,
  Shop
} from '@/store/slices/shopSlice';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const TABS: { id: 'pending' | 'active'; label: string; icon: any }[] = [
  { id: 'pending', label: 'بانتظار الموافقة', icon: ShieldAlert },
  { id: 'active', label: 'الصالونات النشطة', icon: ShieldCheck },
];

const AdminShopsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { shops, loading, error, actionLoading, actionError } = useAppSelector(state => state.shops);

  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    dispatch(fetchAllShops());
  }, [dispatch]);

  useEffect(() => {
    if (actionError) {
      Alert.alert(t('common.actionFailed'), actionError);
      dispatch(clearShopError());
    }
  }, [actionError, dispatch]);

  const getApprovalStatus = (shop: Shop): 'pending' | 'approved' | 'rejected' => {
    if (shop.approvalStatus) return shop.approvalStatus;
    return shop.isApproved ? 'approved' : 'pending';
  };

  const getApprovalStatusLabel = (shop: Shop) => {
    switch (getApprovalStatus(shop)) {
      case 'approved': return 'نشط';
      case 'rejected': return 'مرفوض';
      default: return 'بانتظار الموافقة';
    }
  };

  const pendingShops = shops.filter(s => getApprovalStatus(s) !== 'approved');
  const activeShops = shops.filter(s => getApprovalStatus(s) === 'approved');

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedShop) return;
    setRejectionNote('');
    setPendingAction(status);
    setConfirmModalVisible(true);
  };

  const confirmUpdateStatus = async () => {
    if (!selectedShop || !pendingAction) return;

    try {
      const res = await dispatch(
        updateShopStatus({
          id: selectedShop._id,
          status: pendingAction,
          rejectionReason: pendingAction === 'rejected' ? rejectionNote || undefined : undefined,
        })
      );
      if (updateShopStatus.fulfilled.match(res)) {
        setSelectedShop(null);
      }
      setConfirmModalVisible(false);
      setPendingAction(null);
      setRejectionNote('');
    } catch (err) {
      console.log('Failed to update status', err);
      setConfirmModalVisible(false);
      setPendingAction(null);
      setRejectionNote('');
    }
  };

  const renderShopCard = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      onPress={() => setSelectedShop(item)}
      className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="flex-row items-center">
        <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mr-4">
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} className="w-full h-full rounded-2xl" />
          ) : (
            <Store size={24} color={colors.primary} />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-figtree-bold text-lg text-black-main mb-1" numberOfLines={1}>{item.name}</Text>
          <View className="flex-row gap-2 items-center mb-1">
            <User size={12} color={colors.gray.light} className="mr-1" />
            <Text className="font-figtree-regular text-xs text-gray-medium" numberOfLines={1}>
              {item.ownerId?.name || 'مالكة غير معروفة'}
            </Text>
          </View>
          <View className="flex-row  gap-2 items-center">
            <MapPin size={12} color={colors.gray.light} className="mr-1" />
            <Text className="font-figtree-regular text-xs text-gray-medium" numberOfLines={1}>
              {item.cityId?.name || 'مدينة غير معروفة'}
            </Text>
          </View>
        </View>
        {getApprovalStatus(item) !== 'approved' && (
          <View className={`px-3 py-1.5 rounded-full ml-2 border ${
            getApprovalStatus(item) === 'rejected'
              ? 'bg-error-light border-error/20'
              : 'bg-warning-light border-warning/20'
          }`}>
            <Text className={`font-figtree-bold text-xs ${
              getApprovalStatus(item) === 'rejected' ? 'text-error' : 'text-warning'
            }`}>
              {getApprovalStatusLabel(item)}
            </Text>
          </View>
        )}
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
        <Text className="font-figtree-bold text-xl text-black-main">إدارة الصالونات</Text>
      </View>

      {/* Tabs */}
      <View className="py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isLast = index === TABS.length - 1;
            const count = tab.id === 'pending' ? pendingShops.length : activeShops.length;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-row items-center justify-center gap-2 px-5 py-3 rounded-2xl ${isActive
                    ? 'bg-white border border-gray-lighter'
                    : 'bg-gray-100/50 border border-transparent'
                  } ${!isLast ? 'mr-3' : ''}`}
              >
                <Icon size={16} color={isActive ? colors.primary : colors.gray.light} />
                <Text className={`font-figtree-bold text-sm ${isActive ? 'text-black-main' : 'text-gray-medium'}`}>
                  {tab.label}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/10' : 'bg-gray-200'}`}>
                  <Text className={`font-figtree-bold text-[10px] ${isActive ? 'text-primary' : 'text-gray-medium'}`}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'pending' ? pendingShops : activeShops}
          keyExtractor={(item) => item._id}
          renderItem={renderShopCard}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="font-figtree-medium text-gray-medium">
                {activeTab === 'pending' ? 'لا توجد صالونات بانتظار الموافقة.' : 'لا توجد صالونات نشطة.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Shop Details Modal */}
      <Modal 
        visible={!!selectedShop} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setSelectedShop(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          {selectedShop && (
            <View 
              className="bg-background rounded-t-[30px] p-4 shadow-2xl flex-1 mt-24"
              style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
            >
              <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-3" />

              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-figtree-bold text-2xl text-black-main">تفاصيل الصالون</Text>
                <TouchableOpacity onPress={() => setSelectedShop(null)} className="w-8 h-8 bg-gray-lighter rounded-full items-center justify-center">
                  <X size={18} color="#14110A" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Main Info */}
              <View className="bg-white p-5 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 mb-4">
                <View className="flex-row items-center mb-4">
                  <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mr-4">
                    {selectedShop.images && selectedShop.images.length > 0 ? (
                      <Image source={{ uri: selectedShop.images[0] }} className="w-full h-full rounded-2xl" />
                    ) : (
                      <Store size={28} color={colors.primary} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-figtree-bold text-2xl text-black-main mb-1">{selectedShop.name}</Text>
                    <View className={`self-start px-2 py-1 rounded-md ${
                      getApprovalStatus(selectedShop) === 'approved'
                        ? 'bg-success-light'
                        : getApprovalStatus(selectedShop) === 'rejected'
                          ? 'bg-error-light'
                          : 'bg-warning-light'
                    }`}>
                      <Text className={`font-figtree-bold text-[10px] tracking-wider ${
                        getApprovalStatus(selectedShop) === 'approved'
                          ? 'text-success'
                          : getApprovalStatus(selectedShop) === 'rejected'
                            ? 'text-error'
                            : 'text-warning'
                      }`}>
                        {getApprovalStatusLabel(selectedShop)}
                      </Text>
                    </View>
                  </View>
                </View>

                {getApprovalStatus(selectedShop) === 'rejected' && selectedShop.rejectionReason ? (
                  <View className="bg-error-light/50 p-3 rounded-2xl mb-4 border border-error/20">
                    <Text className="font-figtree-bold text-[10px] text-error mb-1">سبب الرفض</Text>
                    <Text className="font-figtree-medium text-sm text-error">{selectedShop.rejectionReason}</Text>
                  </View>
                ) : null}

                {selectedShop.description ? (
                  <Text className="font-figtree-regular text-sm text-gray-dark leading-6 mb-4">
                    {selectedShop.description}
                  </Text>
                ) : null}

                <View className="bg-gray-50 p-3 rounded-2xl mb-3 flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5">
                    <User size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-figtree-bold text-[10px] text-gray-medium uppercase tracking-wider mb-0.5">المالكة</Text>
                    <Text className="font-figtree-bold text-sm text-black-main">{selectedShop.ownerId?.name}</Text>
                    <Text className="font-figtree-medium text-xs text-gray-dark">{selectedShop.ownerId?.email}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 p-3 rounded-2xl mb-3 flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5">
                    <MapPin size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-figtree-bold text-[10px] text-gray-medium uppercase tracking-wider mb-0.5">الموقع</Text>
                    <Text className="font-figtree-bold text-sm text-black-main" numberOfLines={2}>{selectedShop.address}</Text>
                    <Text className="font-figtree-medium text-xs text-gray-dark">{selectedShop.cityId?.name}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 p-3 rounded-2xl flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5">
                    <Clock size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-figtree-bold text-[10px] text-gray-medium uppercase tracking-wider mb-0.5">تاريخ التسجيل</Text>
                    <Text className="font-figtree-bold text-sm text-black-main">
                      {dayjs(selectedShop.createdAt).format('MMMM D, YYYY')}
                    </Text>
                    <Text className="font-figtree-medium text-xs text-gray-dark">
                      {dayjs(selectedShop.createdAt).format('h:mm A')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Block (if active) */}
              {getApprovalStatus(selectedShop) === 'approved' && (
                <View className="flex-row justify-between mb-4">
                  <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 mr-2 items-center">
                    <Star size={24} color={colors.warning.DEFAULT} className="mb-2" />
                    <Text className="font-figtree-bold text-xl text-black-main">{Number(selectedShop.rating || 0).toFixed(1)}</Text>
                    <Text className="font-figtree-medium text-xs text-gray-medium">التقييم</Text>
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 ml-2 items-center">
                    <User size={24} color={colors.primary} className="mb-2" />
                    <Text className="font-figtree-bold text-xl text-black-main">{selectedShop.reviewCount}</Text>
                    <Text className="font-figtree-medium text-xs text-gray-medium">تقييمات</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-gray-100">
              {getApprovalStatus(selectedShop) === 'approved' ? (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('rejected')}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-error-light border border-error/20 rounded-xl items-center justify-center flex-row gap-2"
                >
                  {actionLoading ? <ActivityIndicator color={colors.error.DEFAULT} /> : (
                    <>
                      <ShieldAlert size={20} color={colors.error.DEFAULT} />
                      <Text className="font-figtree-bold text-error text-lg">سحب الموافقة</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-3">
                  {getApprovalStatus(selectedShop) !== 'rejected' && (
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus('rejected')}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-white border border-error rounded-xl items-center justify-center flex-row gap-2"
                    >
                      <XCircle size={20} color={colors.error.DEFAULT} />
                      <Text className="font-figtree-bold text-error text-lg">رفض</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleUpdateStatus('approved')}
                    disabled={actionLoading}
                    className={`${getApprovalStatus(selectedShop) === 'rejected' ? 'w-full' : 'flex-1'} py-3 bg-success rounded-xl items-center justify-center flex-row shadow-sm shadow-success/30 gap-2`}
                  >
                    {actionLoading ? <ActivityIndicator color={colors.white} /> : (
                      <>
                        <CheckCircle2 size={20} color={colors.white} />
                        <Text className="font-figtree-bold text-white text-lg">موافقة</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModalVisible}
        onClose={() => {
          setConfirmModalVisible(false);
          setPendingAction(null);
          setRejectionNote('');
        }}
        onConfirm={confirmUpdateStatus}
        title={pendingAction === 'approved' ? t('adminScreens.approveShop') : pendingAction === 'rejected' ? t('adminScreens.rejectShop') : ''}
        message={
          pendingAction === 'approved' 
            ? `${t('adminScreens.approveShopConfirm')} ${selectedShop?.name}${t('adminScreens.approveShopConfirmSuffix')}`
            : `${t('adminScreens.rejectShopConfirm')} ${selectedShop?.name}${t('adminScreens.rejectShopConfirmSuffix')}`
        }
        confirmText={pendingAction === 'approved' ? t('adminScreens.approve') : t('adminScreens.reject')}
        type={pendingAction === 'approved' ? 'primary' : 'danger'}
        showNote={pendingAction === 'rejected'}
        noteValue={rejectionNote}
        onNoteChange={setRejectionNote}
        notePlaceholder="سبب الرفض (اختياري)..."
      />

    </View>
  );
};

export default AdminShopsScreen;
