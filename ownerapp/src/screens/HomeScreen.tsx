import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Users, 
  Store, 
  Bell, 
  Calendar,
  CircleDollarSign,
  Plus,
  Scissors,
  TrendingUp,
  Percent,
  CheckCircle2,
  Ticket,
  ChevronDown,
  Banknote,
  Wallet
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOwnerShops, fetchShopAnalytics, setSelectedShopId } from '@/store/slices/dashboardSlice';
import { fetchNotifications } from '@/store/slices/notificationSlice';
import { fetchSettings } from '@/store/slices/settingSlice';
import { fetchServices } from '@/store/slices/serviceSlice';
import { fetchStaff } from '@/store/slices/staffSlice';
import { MainTabScreenProps } from '@/types/navigation';
import { t } from '@/i18n';
import { isShopRejected } from '@/utils/shopStatus';
import { formatMoney } from '@/utils/helper';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
  <View className="w-[48%] mb-3 bg-white rounded-3xl border border-gray-lighter p-4 items-start shadow-sm shadow-black/5">
    <View className={`p-3 rounded-2xl mb-3 ${colorClass}`}>
      <Icon size={24} color="#B59451" />
    </View>
    <Text className="text-black-main font-figtree-bold text-2xl mb-1 tracking-tight">{value}</Text>
    <Text className="text-gray-medium font-figtree-medium text-xs">{label}</Text>
  </View>
);

const QuickAction = ({ icon: Icon, label, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="items-center justify-center mr-4"
  >
    <View className="w-16 h-16 rounded-2xl bg-white items-center justify-center mb-2 border border-gray-lighter shadow-sm shadow-black/5">
      <Icon size={24} color="#B59451" />
    </View>
    <Text className="text-gray-dark font-figtree-medium text-xs">{label}</Text>
  </TouchableOpacity>
);

const SetupStep = ({ label, done, onPress }: { label: string; done: boolean; onPress?: () => void }) => (
  <TouchableOpacity
    disabled={!onPress || done}
    onPress={onPress}
    className="flex-row items-center justify-between bg-white px-4 py-3 rounded-2xl mb-2 border border-gray-lighter"
  >
    <View className="flex-row items-center flex-1">
      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${done ? 'bg-success/20' : 'bg-warning/20'}`}>
        {done ? <CheckCircle2 size={18} color="#10B981" /> : <View className="w-2.5 h-2.5 rounded-full bg-warning" />}
      </View>
      <Text className={`font-figtree-medium text-sm flex-1 ${done ? 'text-gray-medium' : 'text-black-main'}`}>{label}</Text>
    </View>
    <Text className={`font-figtree-bold text-xs ${done ? 'text-success' : 'text-primary'}`}>
      {done ? t('ownerSetup.done') : t('ownerSetup.todo')}
    </Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }: MainTabScreenProps<'Home'>) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { shops, selectedShopId, analytics, isLoadingShops, isLoadingAnalytics } = useAppSelector((state) => state.dashboard);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { settings } = useAppSelector((state) => state.settings);
  const { services } = useAppSelector((state) => state.services);
  const { staffList } = useAppSelector((state) => state.staff);
  
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const currency = settings?.currency || 'ل.س';

  const getCurrencyIcon = (symbol: string) => {
    switch (symbol) {
      case '$': return CircleDollarSign;
      default: return Banknote;
    }
  };

  const loadInitialData = () => {
    dispatch(fetchOwnerShops());
    dispatch(fetchNotifications());
    dispatch(fetchSettings());
  };

  useEffect(() => {
    loadInitialData();
  }, [dispatch]);

  useEffect(() => {
    if (selectedShopId) {
      dispatch(fetchShopAnalytics(selectedShopId));
      dispatch(fetchServices(selectedShopId));
      dispatch(fetchStaff(selectedShopId));
    }
  }, [selectedShopId, dispatch]);

  const onRefresh = () => {
    loadInitialData();
    if (selectedShopId) {
      dispatch(fetchShopAnalytics(selectedShopId));
      dispatch(fetchServices(selectedShopId));
      dispatch(fetchStaff(selectedShopId));
    }
  };

  const selectedShop = shops.find(s => s._id === selectedShopId);
  const shopRejected = isShopRejected(selectedShop);
  const hasHours = !!(selectedShop?.operatingHours?.some((h) => !h.isClosed && h.open && h.close));
  const setupComplete = !!selectedShop && services.length > 0 && staffList.length > 0 && hasHours && selectedShop.isApproved;
  const showSetup = !!selectedShop && !setupComplete;

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={isLoadingShops || isLoadingAnalytics} onRefresh={onRefresh} tintColor="#B59451" />
        }
      >
        {/* Header Section */}
        <View className="px-3 flex-row justify-between items-center mb-3 mt-2 z-50">
          <View className="flex-row items-center flex-1">
            <Image 
              source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=11' }}
              className="w-12 h-12 rounded-full border-2 border-primary mr-3 bg-white"
            />
            <View className="flex-1">
              <Text className="text-gray-medium font-figtree-regular text-xs">{t('ownerHome.welcomeBack')} {user?.name?.split(' ')[0]}</Text>
              
              {shops.length > 0 ? (
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => setShowShopDropdown(!showShopDropdown)}
                >
                  <Text className="text-black-main font-figtree-bold text-lg mr-1" numberOfLines={1}>
                    {selectedShop?.name || t('ownerHome.selectShop')}
                  </Text>
                  {shops.length > 1 && <ChevronDown size={16} color={colors['black-main']} />}
                </TouchableOpacity>
              ) : (
                <Text className="text-black-main font-figtree-bold text-lg" numberOfLines={1}>
                  {t('ownerHome.ownerDashboard')}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
            >
              <Bell size={20} color="#14110A" />
              {unreadCount > 0 && (
                <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary border border-white" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Shop Dropdown Menu */}
        {showShopDropdown && shops.length > 1 && (
          <View className="mx-3 bg-white rounded-2xl border border-gray-lighter shadow-sm shadow-black/5 mb-6 overflow-hidden z-50 absolute top-20 left-0 right-0">
            {shops.map((shop) => (
              <TouchableOpacity 
                key={shop._id}
                className={`p-4 border-b border-gray-lighter flex-row justify-between items-center ${shop._id === selectedShopId ? 'bg-primary/5' : ''}`}
                onPress={() => {
                  dispatch(setSelectedShopId(shop._id));
                  setShowShopDropdown(false);
                }}
              >
                <Text className={`font-figtree-medium ${shop._id === selectedShopId ? 'text-primary' : 'text-black-main'}`}>
                  {shop.name}
                </Text>
                {shop._id === selectedShopId && <CheckCircle2 size={18} color="#B59451" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {shops.length === 0 && !isLoadingShops ? (
          <View className="mx-3 bg-white p-4 rounded-3xl border border-gray-lighter items-center justify-center shadow-sm shadow-black/5 mt-10">
            <Store size={60} color="#B59451" className="mb-4" />
            <Text className="text-black-main font-figtree-bold text-2xl mb-2 text-center">{t('ownerHome.noShopsYet')}</Text>
            <Text className="text-gray-medium font-figtree-regular text-base text-center mb-6">
              {t('ownerHome.noShopsHint')}
            </Text>
            <TouchableOpacity 
              className="bg-primary px-3 gap-2 py-3 rounded-full flex-row items-center"
              onPress={() => navigation.navigate('CreateShop')}
            >
              <Plus size={20} color="#FFF" className="mr-2" />
              <Text className="text-white font-figtree-bold text-base">{t('ownerHome.registerShop')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {showSetup && (
              <View className="px-3 mb-4">
                <Text className="text-black-main font-figtree-bold text-lg mb-1">{t('ownerSetup.title')}</Text>
                <Text className="text-gray-medium font-figtree-regular text-sm mb-3">{t('ownerSetup.subtitle')}</Text>
                <SetupStep label={t('ownerSetup.createShop')} done={!!selectedShop} />
                <SetupStep
                  label={t('ownerSetup.services')}
                  done={services.length > 0}
                  onPress={() => selectedShop && navigation.navigate('ManageServices', { shop: selectedShop as any })}
                />
                <SetupStep
                  label={t('ownerSetup.staff')}
                  done={staffList.length > 0}
                  onPress={() => selectedShop && navigation.navigate('ManageStaff', { shop: selectedShop as any })}
                />
                <SetupStep
                  label={t('ownerSetup.hours')}
                  done={hasHours}
                  onPress={() => selectedShop && navigation.navigate('EditShop', { shop: selectedShop as any })}
                />
                {shopRejected ? (
                  <SetupStep
                    label={t('ownerSetup.rejected')}
                    done={false}
                    onPress={() => selectedShop && navigation.navigate('EditShop', { shop: selectedShop as any })}
                  />
                ) : (
                  <SetupStep
                    label={selectedShop?.isApproved ? t('ownerSetup.approved') : t('ownerSetup.awaitApproval')}
                    done={!!selectedShop?.isApproved}
                  />
                )}
              </View>
            )}

            {/* KPI Stats Grid */}
            <View className="px-3 flex-row flex-wrap justify-between -z-10">
              <StatCard 
                icon={getCurrencyIcon(currency)} 
                label="الإيراد الشهري" 
                value={formatMoney(analytics?.monthlyRevenue, currency)} 
                colorClass="bg-green-500/10" 
              />
              <StatCard 
                icon={Calendar} 
                label="القادمة" 
                value={analytics?.upcomingAppointments || 0} 
                colorClass="bg-blue-500/10" 
              />
              <StatCard 
                icon={Percent} 
                label="نسبة الإلغاء" 
                value={`${analytics?.cancellationRate || 0}%`} 
                colorClass="bg-red-500/10" 
              />
              <StatCard 
                icon={TrendingUp} 
                label="أفضل الخدمات" 
                value={analytics?.topServices?.length || 0} 
                colorClass="bg-purple-500/10" 
              />
            </View>

            {/* Quick Actions */}
            <View className="mb-3 mt-0 -z-10">
              <Text className="px-4 text-black-main font-figtree-bold text-lg mb-3">إجراءات سريعة</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
              >
                <QuickAction icon={Scissors} label="الخدمات" onPress={() => selectedShop && navigation.navigate('ManageServices', { shop: selectedShop as any })} />
                <QuickAction icon={Users} label="الموظفون" onPress={() => selectedShop && navigation.navigate('ManageStaff', { shop: selectedShop as any })} />
                <QuickAction icon={Ticket} label="كوبونات" onPress={() => selectedShop && navigation.navigate('ManageCoupons', { shop: selectedShop as any })} />
                <QuickAction icon={Calendar} label="الحجوزات" onPress={() => navigation.navigate('Bookings' as any)} />
                <QuickAction icon={Store} label="معلومات" onPress={() => selectedShop && navigation.navigate('ShopDetails', { shop: selectedShop as any })} />
                <QuickAction icon={Wallet} label="المحفظة" onPress={() => navigation.navigate('OwnerWallet' as any)} />
              </ScrollView>
            </View>

            {/* Top Performing Services */}
            <View className="px-3 mb-3 -z-10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-black-main font-figtree-bold text-lg">أفضل الخدمات</Text>
              </View>

              {analytics?.topServices && analytics.topServices.length > 0 ? (
                analytics.topServices.map((service, index) => (
                  <View key={index} className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter flex-row items-center justify-between shadow-sm shadow-black/5">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
                        <Scissors size={20} color="#B59451" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className="text-black-main font-figtree-bold text-base mb-1" numberOfLines={1}>{service.name}</Text>
                        <Text className="text-gray-medium font-figtree-medium text-xs">
                          {service.count} حجز هذا الشهر
                        </Text>
                      </View>
                    </View>
                    <View className="bg-background px-3 py-1.5 rounded-full">
                      <Text className="text-primary font-figtree-bold text-xs">#{index + 1}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-white p-5 rounded-3xl border border-gray-lighter items-center justify-center shadow-sm shadow-black/5">
                  <TrendingUp size={32} color={colors.gray.lighter} className="mb-3" />
                  <Text className="text-gray-medium font-figtree-medium text-sm text-center">
                    لا توجد بيانات خدمات لهذا الشهر.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
