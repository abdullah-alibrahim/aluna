import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTickets, Ticket } from '@/store/slices/ticketSlice';
import { MessageSquare, ChevronRight, Plus } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import twConfig from '../../tailwind.config.js';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

dayjs.extend(relativeTime);

const colors = twConfig.theme.extend.colors;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OwnerMessagesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const { tickets, loading } = useAppSelector(state => state.tickets);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const renderMessageCard = ({ item }: { item: Ticket }) => {
    // Generate a quick snippet from the reason for now, later we could pull the last message
    const snippet = item.reason; 
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Chat', { ticketId: item._id, subject: item.subject })}
        className="flex-row items-center bg-white p-4 mb-3 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5"
      >
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
          <MessageSquare size={20} color={colors.primary} />
        </View>
        
        <View className="flex-1 mr-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-figtree-bold text-base text-black-main" numberOfLines={1}>{item.subject}</Text>
            <Text className="font-figtree-medium text-xs text-gray-medium">{dayjs(item.createdAt).fromNow()}</Text>
          </View>
          <Text className="font-figtree-medium text-sm text-gray-dark" numberOfLines={1}>{snippet}</Text>
        </View>
        
        {item.status === 'in_progress' && (
          <View className="w-3 h-3 rounded-full bg-primary mr-2" />
        )}
        
        <ChevronRight size={20} color={colors['gray-medium']} />
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-3 py-4 flex-row justify-between items-center bg-background z-10">
        <Text className="font-figtree-bold text-2xl text-black-main">الرسائل</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateTicket')}
          className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={item => item._id}
            renderItem={renderMessageCard}
            contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-20">
                <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-4">
                  <MessageSquare size={40} color={colors.primary} />
                </View>
                <Text className="font-figtree-bold text-xl text-black-main mb-2">لا رسائل</Text>
                <Text className="font-figtree-medium text-gray-medium text-center px-8">
                  لا توجد محادثات نشطة مع الدعم حالياً.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default OwnerMessagesScreen;
