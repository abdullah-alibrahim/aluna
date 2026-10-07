import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Ticket as TicketIcon,
  Search,
  MessageCircle,
  X
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { t } from '@/i18n';
import { 
  fetchTickets, 
  fetchTicketMessages,
  sendTicketMessage,
  addMessageRealTime,
  clearMessages,
  Ticket
} from '@/store/slices/ticketSlice';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import io from 'socket.io-client';
import { API_URL } from '@/api/client';

const colors = twConfig.theme.extend.colors;

const ticketStatusAr = (status?: string) => {
  switch (status) {
    case 'open': return 'مفتوحة';
    case 'in_progress': return 'قيد المعالجة';
    case 'resolved': return 'محلولة';
    case 'closed': return 'مغلقة';
    default: return status || '';
  }
};

const AdminTicketsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { tickets, messages, loading, messagesLoading } = useAppSelector(state => state.tickets);
  const { user, token } = useAppSelector(state => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection for Admin
  useEffect(() => {
    if (user && token) {
      const newSocket = io(API_URL.replace('/api', ''), {
        auth: { token }
      });
      
      newSocket.on('connect', () => {
        newSocket.emit('join', user._id); // Join admin room
      });

      newSocket.on('receiveTicketMessage', (message) => {
        dispatch(addMessageRealTime(message));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token, dispatch]);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTicket) {
      dispatch(fetchTicketMessages(selectedTicket._id));
    } else {
      dispatch(clearMessages());
    }
  }, [selectedTicket, dispatch]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTicket) return;
    
    const text = messageText;
    setMessageText('');
    
    await dispatch(sendTicketMessage({ ticketId: selectedTicket._id, text }));
    // Optimistically update if needed, but the fulfilled reducer does it.
    // Also, if the ticket was OPEN, backend changes it to IN_PROGRESS. We should re-fetch tickets to update list status.
    if (selectedTicket.status === 'open') {
      dispatch(fetchTickets());
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-error-light text-error';
      case 'in_progress': return 'bg-warning-light text-warning';
      case 'resolved': return 'bg-success-light text-success';
      case 'closed': return 'bg-gray-200 text-gray-dark';
      default: return 'bg-gray-200 text-gray-dark';
    }
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity 
      onPress={() => setSelectedTicket(item)}
      className="bg-white p-4 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-4">
          <Text className="font-figtree-bold text-base text-black-main mb-1" numberOfLines={1}>{item.subject}</Text>
          <Text className="font-figtree-regular text-xs text-gray-medium mb-2" numberOfLines={2}>{item.reason}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
          <Text className={`font-figtree-semibold text-[10px] uppercase tracking-wider ${getStatusColor(item.status).split(' ')[1]}`}>
            {ticketStatusAr(item.status)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 mt-1">
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center mr-2">
            <Text className="font-figtree-bold text-[10px] text-primary">{item.userId?.name?.charAt(0) || 'م'}</Text>
          </View>
          <Text className="font-figtree-medium text-xs text-black-main">{item.userId?.name || 'مستخدم'}</Text>
        </View>
        <Text className="font-figtree-regular text-[10px] text-gray-medium">
          {dayjs(item.createdAt).format('D MMM, h:mm A')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: any }) => {
    const isAdmin = item.isAdmin;
    return (
      <View className={`mb-4 max-w-[80%] ${isAdmin ? 'self-end' : 'self-start'}`}>
        {!isAdmin && (
          <Text className="font-figtree-regular text-[10px] text-gray-medium ml-1 mb-1">
            {item.senderId?.name}
          </Text>
        )}
        <View className={`p-4 rounded-3xl ${isAdmin ? 'bg-primary rounded-tr-sm' : 'bg-white border border-gray-lighter shadow-sm shadow-black/5 rounded-tl-sm'}`}>
          <Text className={`font-figtree-regular text-sm ${isAdmin ? 'text-white' : 'text-black-main'}`}>
            {item.text}
          </Text>
        </View>
        <Text className={`font-figtree-regular text-[10px] text-gray-400 mt-1 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
          {dayjs(item.createdAt).format('h:mm A')}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 bg-background z-10 ">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
        >
          <ArrowLeft size={20} color={colors['black-main']} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-figtree-bold text-xl text-black-main">{t('tickets.supportTickets')}</Text>
        </View>
      </View>

      <View className="px-4 py-3">
        <View className="flex-row items-center bg-white rounded-full border border-gray-lighter px-4 h-12 shadow-sm shadow-black/5">
          <Search size={18} color={colors.gray.light} className="mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('tickets.searchPlaceholder')}
            placeholderTextColor={colors.gray.light}
            className="flex-1 font-figtree-medium text-sm text-black-main"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={item => item._id}
          renderItem={renderTicketItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <TicketIcon size={48} color={colors.gray.light} className="mb-4" />
              <Text className="font-figtree-medium text-gray-medium text-base">{t('tickets.noTickets')}</Text>
            </View>
          }
        />
      )}

      {/* Ticket Chat Modal */}
      <Modal visible={!!selectedTicket} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
          {selectedTicket && (
            <View className="flex-1" style={{ paddingTop: insets.top }}>
              {/* Chat Header */}
              <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-lighter shadow-sm shadow-black/5 z-10">
                <View className="flex-row items-center flex-1 pr-2">
                  <TouchableOpacity 
                    onPress={() => setSelectedTicket(null)}
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
                  >
                    <ArrowLeft size={20} color={colors['black-main']} />
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="font-figtree-bold text-base text-black-main" numberOfLines={1}>{selectedTicket.subject}</Text>
                    <Text className="font-figtree-medium text-xs text-gray-medium">
                      {selectedTicket.userId?.name} • {ticketStatusAr(selectedTicket.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Chat Body */}
              <View className="flex-1 px-4 pt-4">
                <View className="bg-white p-4 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 mb-6 self-center max-w-[90%]">
                  <Text className="font-figtree-bold text-sm text-black-main mb-1">{t('tickets.originalIssue')}</Text>
                  <Text className="font-figtree-regular text-sm text-gray-dark leading-5">{selectedTicket.reason}</Text>
                </View>

                {messagesLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} className="my-4" />
                ) : (
                  <FlatList
                    data={messages}
                    keyExtractor={item => item._id}
                    renderItem={renderMessage}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  />
                )}
              </View>

              {/* Chat Input */}
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                <View className="bg-white border-t border-gray-lighter p-4 flex-row items-end shadow-xl" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
                  <TextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder={t('tickets.typeMessage')}
                    placeholderTextColor={colors.gray.light}
                    multiline
                    maxLength={500}
                    className="flex-1 bg-background rounded-3xl px-4 py-3 min-h-[48px] max-h-[120px] font-figtree-medium text-sm text-black-main mr-3 border border-gray-lighter"
                  />
                  <TouchableOpacity 
                    onPress={handleSendMessage}
                    disabled={!messageText.trim()}
                    className={`w-12 h-12 rounded-full items-center justify-center ${messageText.trim() ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-primary/50'}`}
                  >
                    <MessageCircle size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="bg-white border-t border-gray-lighter p-4 items-center justify-center" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
                  <Text className="font-figtree-medium text-sm text-gray-medium">هذه التذكرة مغلقة ولا يمكن استقبال رسائل جديدة.</Text>
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

export default AdminTicketsScreen;
