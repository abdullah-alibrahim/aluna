import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTickets, Ticket } from '@/store/slices/ticketSlice';
import { MessageSquare, ChevronRight, Plus, ArrowLeft } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import twConfig from '../../tailwind.config.js';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { t } from '@/i18n';

dayjs.extend(relativeTime);
dayjs.locale('ar');

const colors = twConfig.theme.extend.colors;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const statusLabel: Record<string, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'محلولة',
  closed: 'مغلقة',
};

const SupportTicketsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { tickets, loading } = useAppSelector((state) => state.tickets);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const renderCard = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Chat', { ticketId: item._id, subject: item.subject })}
      className="flex-row items-center bg-white p-4 mb-3 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center ml-3">
        <MessageSquare size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-figtree-bold text-base text-black-main flex-1" numberOfLines={1}>
            {item.subject}
          </Text>
          <Text className="font-figtree-medium text-xs text-gray-medium mr-2">
            {dayjs(item.createdAt).fromNow()}
          </Text>
        </View>
        <Text className="font-figtree-medium text-sm text-gray-dark" numberOfLines={1}>
          {item.reason}
        </Text>
        <Text className="font-figtree-medium text-[10px] text-primary mt-1">
          {statusLabel[item.status] || item.status}
        </Text>
      </View>
      <ChevronRight size={20} color={colors['gray-medium']} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-3 py-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-lighter"
        >
          <ArrowLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-lg text-black-main">{t('profile.supportTickets')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateTicket')}
          className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-lighter"
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 px-6">
              <MessageSquare size={48} color="#D1D5DB" />
              <Text className="font-figtree-bold text-xl text-black-main mt-4 mb-2">لا تذاكر بعد</Text>
              <Text className="font-figtree-regular text-sm text-gray-medium text-center mb-6">
                تواصلي مع الدعم لأي مشكلة في الحجز أو الحساب.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateTicket')}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="font-figtree-bold text-white">رسالة جديدة</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

export default SupportTicketsScreen;
