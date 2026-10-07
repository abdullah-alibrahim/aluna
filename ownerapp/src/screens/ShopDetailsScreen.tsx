import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { 
  Store, 
  MapPin,
  User,
  Clock,
  Star,
  ChevronLeft,
  CalendarDays,
  Scissors,
  Settings,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Ban
} from 'lucide-react-native';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { useAppSelector } from '@/store/hooks';
import { getShopApprovalLabel, isShopRejected } from '@/utils/shopStatus';

const colors = twConfig.theme.extend.colors;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShopDetails'>;
type ShopDetailsRouteProp = RouteProp<RootStackParamList, 'ShopDetails'>;

// Reusable Stat Card Component
const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
  <View className="w-[31%] mb-0 bg-white rounded-3xl border border-gray-lighter p-3 items-center shadow-sm shadow-black/5">
    <View className={`p-2 rounded-2xl mb-2 ${colorClass}`}>
      <Icon size={20} color="#B59451" />
    </View>
    <Text className="text-black-main font-figtree-bold text-lg mb-0.5 tracking-tight">{value}</Text>
    <Text className="text-gray-medium font-figtree-medium text-[10px] text-center">{label}</Text>
  </View>
);

// Reusable Quick Action Component
const QuickAction = ({ icon: Icon, label, onPress, disabled }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    disabled={disabled}
    className={`items-center justify-center mr-4 ${disabled ? 'opacity-50' : ''}`}
  >
    <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mb-2 border border-gray-lighter shadow-sm shadow-black/5">
      <Icon size={20} color="#B59451" />
    </View>
    <Text className="text-gray-dark font-figtree-medium text-xs text-center">{label}</Text>
  </TouchableOpacity>
);

const ShopDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ShopDetailsRouteProp>();
  const initialShop = route.params.shop;
  const myShops = useAppSelector(state => state.shops.myShops);
  
  // Always use the latest shop from Redux if available, fallback to route.params
  const shop = myShops.find(s => s._id === initialShop._id) || initialShop;

  const rejected = isShopRejected(shop);

  const renderStatusIcon = () => {
    if (rejected) return <Ban size={20} color={colors.error.DEFAULT} />;
    if (!shop.isApproved) return <ShieldAlert size={20} color={colors.warning.DEFAULT} />;
    if (!shop.isActive) return <Ban size={20} color={colors.error.DEFAULT} />;
    return <ShieldCheck size={20} color={colors.success.DEFAULT} />;
  };

  const getStatusText = () => {
    if (rejected) return 'مرفوض';
    if (!shop.isApproved) return getShopApprovalLabel(shop);
    if (shop.isActive === false) return 'متوقف';
    return 'نشط';
  };

  const getStatusColorClass = () => {
    if (rejected) return 'bg-error-light border-error/20';
    if (!shop.isApproved) return 'bg-warning-light border-warning/20';
    if (!shop.isActive) return 'bg-error-light border-error/20';
    return 'bg-success-light border-success/20';
  };

  const renderOperatingHours = () => {
    if (!shop.operatingHours || shop.operatingHours.length === 0) return null;
    const currentDay = dayjs().format('dddd');

    return (
      <View className="mb-3 px-3">
        <Text className="px-1 text-black-main font-figtree-bold text-lg mb-3">ساعات العمل</Text>
        <View className="bg-white rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 overflow-hidden p-2">
          {shop.operatingHours.map((hours, index) => {
            const isToday = hours.day === currentDay;
            return (
              <View 
                key={hours._id || index}
                className={`flex-row items-center justify-between p-2 rounded-2xl ${isToday ? 'bg-primary/5 border border-primary/20' : ''}`}
              >
                <View className="flex-row items-center gap-2">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${isToday ? 'bg-primary/20' : 'bg-gray-50'}`}>
                    <CalendarDays size={14} color={isToday ? colors.primary : colors.gray.medium} />
                  </View>
                  <Text className={`font-figtree-semibold text-sm ${isToday ? 'text-primary' : 'text-black-main'}`}>
                    {hours.day}
                    {isToday && <Text className="text-xs"> (اليوم)</Text>}
                  </Text>
                </View>
                <View>
                  {hours.isClosed ? (
                    <View className="bg-error-light px-3 py-1 rounded-full border border-error/20">
                      <Text className="font-figtree-bold text-xs text-error">مغلق</Text>
                    </View>
                  ) : (
                    <Text className={`font-figtree-semibold text-sm ${isToday ? 'text-black-main' : 'text-gray-dark'}`}>
                      {hours.open} - {hours.close}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        
        {/* Header Section */}
        <View className="px-3 flex-row items-center justify-between mb-4 mt-2">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 border border-gray-lighter shadow-sm shadow-black/5"
            >
              <ChevronLeft size={20} color="#14110A" />
            </TouchableOpacity>
            
            {shop.images && shop.images.length > 0 ? (
              <Image 
                source={{ uri: shop.images[0] }} 
                className="w-12 h-12 rounded-full border border-gray-lighter mr-3"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/20 mr-3">
                <Store size={20} color={colors.primary} />
              </View>
            )}
            
            <View className="flex-1">
              <Text className="text-gray-medium font-figtree-regular text-xs uppercase tracking-wider">تفاصيل الصالون</Text>
              <Text className="text-black-main font-figtree-bold text-lg" numberOfLines={1}>
                {shop.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Warning if Pending / Rejected */}
        {rejected ? (
          <View className="px-3 mb-4">
            <View className="bg-error-light p-3 rounded-2xl border border-error/20 flex-row items-start gap-2">
              <Ban size={20} color={colors.error.DEFAULT} className="mt-0.5" />
              <View className="flex-1">
                <Text className="font-figtree-bold text-sm text-error mb-1">مرفوض</Text>
                <Text className="font-figtree-medium text-xs text-error/80 leading-4 mb-2">
                  {shop.rejectionReason || 'تم رفض الصالون من الإدارة. عدّلي البيانات وأعيدي الإرسال للمراجعة.'}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditShop', { shop })}
                  className="self-start bg-error px-3 py-1.5 rounded-full"
                >
                  <Text className="font-figtree-bold text-xs text-white">تعديل وإعادة إرسال</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : !shop.isApproved ? (
          <View className="px-3 mb-4">
            <View className="bg-warning-light p-3 rounded-2xl border border-warning/20 flex-row items-start gap-2">
              <ShieldAlert size={20} color={colors.warning.DEFAULT} className="mt-0.5" />
              <View className="flex-1">
                <Text className="font-figtree-bold text-sm text-warning mb-1">بانتظار الموافقة</Text>
                <Text className="font-figtree-medium text-xs text-warning/80 leading-4">
                  هذا الصالون قيد المراجعة من الإدارة. الإجراءات محدودة حتى تتم الموافقة.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* KPI Stats Grid */}
        <View className="px-3 flex-row flex-wrap justify-between mb-2">
          <StatCard 
            icon={Star} 
            label="التقييم" 
            value={Number(shop.rating ?? 0).toFixed(1)} 
            colorClass="bg-yellow-500/20" 
          />
          <StatCard 
            icon={User} 
            label="المراجعات" 
            value={shop.reviewCount || 0} 
            colorClass="bg-blue-500/20" 
          />
          <View className="w-[31%] mb-3 bg-white rounded-3xl border border-gray-lighter p-3 items-center shadow-sm shadow-black/5">
            <View className={`p-2 rounded-2xl mb-2 ${getStatusColorClass()}`}>
              {renderStatusIcon()}
            </View>
            <Text className="text-black-main font-figtree-bold text-lg mb-0.5 tracking-tight">{getStatusText()}</Text>
            <Text className="text-gray-medium font-figtree-medium text-[10px] text-center">الحالة</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-3">
          <Text className="px-3 text-black-main font-figtree-bold text-lg mb-3">إجراءات سريعة</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
            <QuickAction 
              icon={Scissors} 
              label="الخدمات" 
              disabled={!shop.isApproved}
              onPress={() => navigation.navigate('ManageServices', { shop })} 
            />
            <QuickAction 
              icon={User} 
              label="الموظفون" 
              disabled={!shop.isApproved}
              onPress={() => navigation.navigate('ManageStaff', { shop })} 
            />
            <QuickAction 
              icon={Settings} 
              label="الإعدادات" 
              onPress={() => navigation.navigate('EditShop', { shop })} 
            />
            <QuickAction
              icon={MapPin}
              label="الفروع"
              onPress={() => navigation.navigate('ManageBranches', { shop })}
            />
            <QuickAction
              icon={Receipt}
              label="نقطة البيع"
              disabled={!shop.isApproved}
              onPress={() => navigation.navigate('Pos', { shop })}
            />
          </ScrollView>
        </View>

        {/* Description Section */}
        {shop.description && (
          <View className="px-3 mb-3">
            <Text className="px-1 font-figtree-bold text-lg text-black-main mb-3">عن الصالون</Text>
            <View className="bg-white p-4 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5">
              <Text className="font-figtree-regular text-sm text-gray-dark leading-6">
                {shop.description}
              </Text>
            </View>
          </View>
        )}

        {/* Location & Contact Grid */}
        <View className="px-3 mb-3">
          <Text className="px-1 font-figtree-bold text-lg text-black-main mb-3">التفاصيل</Text>
          <View className="bg-white p-4 rounded-3xl mb-3 flex-row items-center gap-3 border border-gray-lighter shadow-sm shadow-black/5">
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
              <MapPin size={22} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-figtree-bold text-[10px] text-gray-medium uppercase tracking-wider mb-0.5">الموقع</Text>
              <Text className="font-figtree-bold text-sm text-black-main" numberOfLines={2}>{shop.address}</Text>
              {typeof shop.cityId === 'object' && shop.cityId !== null && shop.cityId.name && (
                <Text className="font-figtree-medium text-xs text-gray-dark mt-0.5">{shop.cityId.name}</Text>
              )}
            </View>
          </View>

          <View className="bg-white p-4 rounded-3xl flex-row items-center gap-3 border border-gray-lighter shadow-sm shadow-black/5">
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
              <Clock size={22} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-figtree-bold text-[10px] text-gray-medium uppercase tracking-wider mb-0.5">تاريخ الانضمام</Text>
              <Text className="font-figtree-bold text-sm text-black-main">
                {dayjs(shop.createdAt).format('MMMM D, YYYY')}
              </Text>
              <Text className="font-figtree-medium text-xs text-gray-dark mt-0.5">
                {dayjs(shop.createdAt).format('h:mm A')}
              </Text>
            </View>
          </View>
        </View>

        {/* Operating Hours */}
        {renderOperatingHours()}

      </ScrollView>
    </View>
  );
};

export default ShopDetailsScreen;
