// @ts-nocheck
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Store, 
  Settings, 
  Bell, 
  ChevronRight, 
  MapPin, 
  CircleDollarSign,
  Ticket,
  Calendar,
  Wallet,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats, fetchPendingShops } from '@/store/slices/dashboardSlice';
import { fetchNotifications } from '@/store/slices/notificationSlice';
import { fetchSettings } from '@/store/slices/settingSlice';
import { MainTabScreenProps } from '@/types/navigation';
import { t } from '@/i18n';
import { formatMoney } from '@/utils/helper';

const StatCard = ({ icon: Icon, label, value, colorClass, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    className="w-[48%] mb-2 bg-white rounded-3xl border border-gray-lighter p-4 items-start shadow-sm shadow-black/5"
  >
    <View className={`p-3 rounded-2xl mb-2 ${colorClass}`}>
      <Icon size={24} color="#B59451" />
    </View>
    <Text className="text-black-main font-figtree-bold text-2xl mb-1 tracking-tight">{value}</Text>
    <Text className="text-gray-medium font-figtree-medium text-xs">{label}</Text>
  </TouchableOpacity>
);

const QuickAction = ({ icon: Icon, label, onPress }) => (
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

const HomeScreen = ({ navigation }: MainTabScreenProps<'Home'>) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, pendingShops, isLoading } = useAppSelector((state) => state.dashboard);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { settings } = useAppSelector((state) => state.settings);
  
  const currency = settings?.currency || 'ل.س';

  const loadData = () => {
    dispatch(fetchDashboardStats());
    dispatch(fetchPendingShops());
    dispatch(fetchNotifications());
    dispatch(fetchSettings());
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={isLoading && !!stats} onRefresh={loadData} tintColor="#B59451" />
        }
      >
        <View className="px-3 flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-1">
            <Image 
              source={{ uri: user?.avatar || user?.profilePicture || 'https://i.pravatar.cc/150?img=11' }}
              className="w-12 h-12 rounded-full border-2 border-primary mr-3 bg-white"
            />
            <View>
              <Text className="text-gray-medium font-figtree-regular text-xs">{t('admin.welcome')}</Text>
              <Text className="text-black-main font-figtree-bold text-lg" numberOfLines={1}>
                {user?.name || 'Administrator'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AdminNotifications')}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
          >
            <Bell size={20} color="#14110A" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary border border-white" />
            )}
          </TouchableOpacity>
        </View>

        {isLoading && !stats ? (
          <View className="flex-1 items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#B59451" />
          </View>
        ) : (
          <>
            <View className="px-3 flex-row flex-wrap justify-between">
              <StatCard 
                icon={Store} 
                label={t('admin.pendingShops')} 
                value={stats?.pendingShops || 0} 
                colorClass="bg-blue-500/20"
                onPress={() => navigation.navigate('AdminShops')}
              />
              <StatCard 
                icon={Wallet} 
                label={t('admin.withdrawals')} 
                value={stats?.pendingWithdrawals || 0} 
                colorClass="bg-purple-500/20"
                onPress={() => navigation.navigate('AdminFinances')}
              />
              <StatCard 
                icon={Ticket} 
                label={t('admin.openTickets')} 
                value={stats?.openTickets || 0} 
                colorClass="bg-red-500/20"
                onPress={() => navigation.navigate('AdminTickets')}
              />
              <StatCard 
                icon={CircleDollarSign} 
                label={t('admin.liability')} 
                value={formatMoney(stats?.totalOwedBalance, currency)} 
                colorClass="bg-green-500/20"
                onPress={() => navigation.navigate('AdminFinances')}
              />
            </View>

            <View className="mb-3">
              <Text className="px-3 text-black-main font-figtree-bold text-lg mb-3">{t('admin.quickActions')}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
              >
                <QuickAction icon={Ticket} label={t('admin.tickets')} onPress={() => navigation.navigate('AdminTickets')} />
                <QuickAction icon={Store} label={t('admin.shops')} onPress={() => navigation.navigate('AdminShops')} />
                <QuickAction icon={Calendar} label={t('admin.bookings')} onPress={() => navigation.navigate('AdminBookings')} />
                <QuickAction icon={Wallet} label={t('admin.payouts')} onPress={() => navigation.navigate('AdminFinances')} />
                <QuickAction icon={MapPin} label={t('admin.cities')} onPress={() => navigation.navigate('AdminCities')} />
                <QuickAction icon={ImageIcon} label={t('admin.banners')} onPress={() => navigation.navigate('AdminBanners')} />
                <QuickAction icon={Store} label={t('admin.categories')} onPress={() => navigation.navigate('AdminCategories')} />
                <QuickAction icon={Settings} label={t('admin.settings')} onPress={() => navigation.navigate('AdminSettings')} />
              </ScrollView>
            </View>

            <View className="px-3">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-black-main font-figtree-bold text-lg">{t('admin.actionRequired')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AdminShops')}>
                  <Text className="text-primary font-figtree-medium text-sm">{t('common.seeAll')}</Text>
                </TouchableOpacity>
              </View>

              {pendingShops && pendingShops.length > 0 ? (
                pendingShops.slice(0, 5).map((shop) => (
                  <TouchableOpacity
                    key={shop._id}
                    onPress={() => navigation.navigate('AdminShops')}
                    className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter flex-row items-center shadow-sm shadow-black/5"
                  >
                    <View className="w-14 h-14 rounded-2xl bg-background items-center justify-center mr-4">
                      <Store size={24} color="#B59451" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-black-main font-figtree-bold text-base mb-1" numberOfLines={1}>{shop.name}</Text>
                      <Text className="text-gray-medium font-figtree-regular text-xs" numberOfLines={1}>
                        المالك: {shop.ownerId?.name || 'غير معروف'}
                      </Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-2 rounded-full border border-primary/30 flex-row items-center">
                      <Text className="text-primary font-figtree-bold text-xs mr-1">{t('admin.reviewShop')}</Text>
                      <ChevronRight size={16} color="#B59451" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="bg-white p-4 rounded-3xl border border-gray-lighter items-center justify-center shadow-sm shadow-black/5">
                  <CheckCircle2 size={40} color="#10B981" className="mb-3" />
                  <Text className="text-black-main font-figtree-bold text-base mb-1">{t('admin.allCaughtUp')}</Text>
                  <Text className="text-gray-medium font-figtree-regular text-xs text-center">
                    {t('admin.noPendingShops')}
                  </Text>
                </View>
              )}

              {/* Quick queue shortcuts */}
              <View className="flex-row mt-2 mb-2">
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminFinances')}
                  className="flex-1 bg-white p-4 rounded-3xl border border-gray-lighter mr-2 shadow-sm shadow-black/5"
                >
                  <Text className="text-black-main font-figtree-bold text-sm mb-1">{t('admin.withdrawals')}</Text>
                  <Text className="text-primary font-figtree-bold text-xl">{stats?.pendingWithdrawals || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminTickets')}
                  className="flex-1 bg-white p-4 rounded-3xl border border-gray-lighter ml-2 shadow-sm shadow-black/5"
                >
                  <Text className="text-black-main font-figtree-bold text-sm mb-1">{t('admin.openTickets')}</Text>
                  <Text className="text-primary font-figtree-bold text-xl">{stats?.openTickets || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
