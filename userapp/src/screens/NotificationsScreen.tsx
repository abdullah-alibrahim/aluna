import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, CheckCheck, Store, User, Calendar, CreditCard } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchNotifications, markAsRead, markAllAsRead, Notification } from '@/store/slices/notificationSlice';
import { exitGuestForAuth } from '@/store/slices/authSlice';

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { notifications, loading, error } = useAppSelector((state) => state.notifications);
  const { isGuest, isAuthenticated } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isGuest && isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isGuest, isAuthenticated]);

  const onRefresh = async () => {
    if (isGuest || !isAuthenticated) return;
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  };

  const handlePressNotification = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }
    const data = notification.data || {};
    if (data.screen === 'Bookings' || data.bookingId) {
      (navigation as any).navigate('MainTabs', { screen: 'Bookings' });
      return;
    }
    if (data.screen === 'Messages' || data.ticketId) {
      (navigation as any).navigate('Messages');
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'shop_approval':
        return <Store size={20} color="#B59451" />;
      case 'new_user':
        return <User size={20} color="#10B981" />;
      case 'appointment':
      case 'BOOKING_CREATED':
      case 'BOOKING_UPDATED':
        return <Calendar size={20} color="#3B82F6" />;
      case 'payment':
      case 'PAYMENT_RECEIVED':
      case 'PAYOUT_UPDATED':
        return <CreditCard size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#B59451" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'الآن';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} س`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} ي`;
    return date.toLocaleDateString('ar-SY');
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-3 py-4 bg-background">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
          >
            <ArrowLeft size={20} color="#14110A" />
          </TouchableOpacity>
          <Text className="font-figtree-bold text-xl text-black-main">الإشعارات</Text>
        </View>

        {notifications.some(n => !n.read) && (
          <TouchableOpacity 
            onPress={handleMarkAllAsRead}
            className="flex-row items-center bg-primary/10 px-3 py-2 rounded-full"
          >
            <CheckCheck size={16} color="#B59451" className="mr-1" />
            <Text className="font-figtree-semibold text-primary text-xs">تعيين الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B59451" />
        }
      >
        {isGuest || !isAuthenticated ? (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5 mb-4">
              <Bell size={32} color="#D1D5DB" />
            </View>
            <Text className="font-figtree-bold text-lg text-black-main mb-2">سجّلي الدخول للإشعارات</Text>
            <Text className="font-figtree-regular text-sm text-gray-medium text-center mb-6">
              راح توصلكِ تحديثات الحجوزات والحساب بعد تسجيل الدخول.
            </Text>
            <TouchableOpacity
              onPress={() => dispatch(exitGuestForAuth('Login'))}
              className="bg-primary px-8 py-3 rounded-full"
            >
              <Text className="text-white font-figtree-bold text-base">تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        ) : loading && !refreshing && notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#B59451" />
          </View>
        ) : error && notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-figtree-medium text-rose-500 text-center">{error}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5 mb-4">
              <Bell size={32} color="#D1D5DB" />
            </View>
            <Text className="font-figtree-bold text-lg text-black-main mb-2">لا إشعارات بعد</Text>
            <Text className="font-figtree-regular text-sm text-gray-medium text-center px-6">
              عند وجود تحديثات بخصوص حجوزاتك أو المدفوعات أو حسابك، ستظهر هنا.
            </Text>
          </View>
        ) : (
          <View className="mt-2">
            {notifications.map((notification: Notification) => (
              <TouchableOpacity
                key={notification._id}
                onPress={() => handlePressNotification(notification)}
                activeOpacity={0.7}
                className={`flex-row p-4 mb-3 rounded-3xl border ${
                  !notification.read 
                    ? 'bg-white border-primary/30 shadow-md shadow-primary/10' 
                    : 'bg-white border-gray-lighter shadow-sm shadow-black/5'
                }`}
              >
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${!notification.read ? 'bg-primary/10' : 'bg-background'}`}>
                  {getIconForType(notification.type)}
                </View>
                
                <View className="flex-1 justify-center">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-figtree-bold text-base text-black-main flex-1 mr-2" numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text className="font-figtree-medium text-xs text-gray-medium">
                      {getTimeAgo(notification.createdAt)}
                    </Text>
                  </View>
                  <Text className={`font-figtree-regular text-sm leading-5 ${!notification.read ? 'text-black-main' : 'text-gray-dark'}`}>
                    {notification.message}
                  </Text>
                </View>
                
                {!notification.read && (
                  <View className="w-2 h-2 rounded-full bg-primary absolute top-5 right-4" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;
