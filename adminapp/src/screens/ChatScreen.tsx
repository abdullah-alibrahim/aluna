import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Platform,
  Alert,
  Keyboard
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchTicketMessages, 
  sendTicketMessage, 
  updateTicketStatus,
  clearMessages,
  addMessageRealTime
} from '@/store/slices/ticketSlice';
import { 
  ArrowLeft, 
  MessageCircle,
  CheckCircle2
} from 'lucide-react-native';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import io, { Socket } from 'socket.io-client';
import { API_URL } from '@/api/client';
import { t, ticketStatusLabel } from '@/i18n';

const colors = twConfig.theme.extend.colors;

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  
  const { ticketId, subject, status, reason, userId } = route.params;
  
  const { messages, messagesLoading, actionLoading } = useAppSelector(state => state.tickets);
  const { token } = useAppSelector(state => state.auth);
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (token) {
      newSocket = io(API_URL.replace('/api', ''), {
        auth: { token }
      });
      
      newSocket.on('connect', () => {
        newSocket?.emit('joinTicket', ticketId);
      });

      newSocket.on('newMessage', (message) => {
        dispatch(addMessageRealTime(message));
        // Also scroll to bottom slightly after a new message comes in
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }

    dispatch(fetchTicketMessages(ticketId));

    return () => {
      newSocket?.disconnect();
      dispatch(clearMessages());
    };
  }, [dispatch, ticketId, token]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    setSending(true);
    const textToSend = messageText.trim();
    setMessageText('');
    
    try {
      await dispatch(sendTicketMessage({ ticketId, text: textToSend })).unwrap();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.log('Failed to send message', e);
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const res = await dispatch(updateTicketStatus({ id: ticketId, status: newStatus }));
    if (updateTicketStatus.fulfilled.match(res)) {
      setCurrentStatus(newStatus);
      Alert.alert(t('common.success'), `${t('adminScreens.ticketStatusUpdated')} ${ticketStatusLabel(newStatus)}`);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isAdmin = item.isAdmin;
    return (
      <View className={`mb-4 max-w-[80%] ${isAdmin ? 'self-end' : 'self-start'}`}>
        {!isAdmin && (
          <Text className="font-figtree-regular text-[10px] text-gray-medium ml-1 mb-1">
            {item.senderId?.name || 'User'}
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
    <KeyboardAvoidingView 
      className="flex-1 bg-background" 
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        {/* Chat Header */}
        <View className="flex-row items-center justify-between px-3 py-3 bg-background  shadow-sm shadow-black/5 z-10">
          <View className="flex-row items-center flex-1 pr-2">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
            >
              <ArrowLeft size={20} color={colors['black-main']} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="font-figtree-bold text-base text-black-main" numberOfLines={1}>{subject}</Text>
              <Text className="font-figtree-medium text-xs text-gray-medium">
                {userId?.name || 'مستخدم'} • {currentStatus === 'open' ? 'مفتوحة' : currentStatus === 'in_progress' ? 'قيد المعالجة' : currentStatus === 'resolved' ? 'محلولة' : currentStatus === 'closed' ? 'مغلقة' : currentStatus.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {currentStatus !== 'resolved' && currentStatus !== 'closed' && (
            <TouchableOpacity 
              onPress={() => handleUpdateStatus('resolved')}
              disabled={actionLoading}
              className="bg-success/10 gap-1 px-3 py-2 rounded-full flex-row items-center"
            >
              <CheckCircle2 size={16} color={colors.success.DEFAULT} className="mr-1" />
              <Text className="font-figtree-bold text-xs text-success">حلّ التذكرة</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chat Body */}
        <View className="flex-1 px-3 pt-2">
          <View className="bg-white p-4 rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 mb-3 self-center max-w-[90%]">
            <Text className="font-figtree-bold text-sm text-black-main mb-1">المشكلة الأصلية</Text>
            <Text className="font-figtree-regular text-sm text-gray-dark leading-5">{reason}</Text>
          </View>

          {messagesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} className="my-4" />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item._id}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}
        </View>

        {/* Chat Input */}
        {currentStatus !== 'resolved' && currentStatus !== 'closed' ? (
          <View 
            className="bg-white border-t border-gray-lighter p-4 flex-row items-end shadow-xl" 
            style={{ paddingBottom: isKeyboardVisible ? 16 : Math.max(insets.bottom, 16) }}
          >
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="اكتبي رسالة..."
              placeholderTextColor={colors.gray.light}
              multiline
              maxLength={500}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              className="flex-1 bg-background rounded-3xl px-4 py-3 min-h-[48px] max-h-[120px] font-figtree-medium text-sm text-black-main mr-3 border border-gray-lighter"
            />
            <TouchableOpacity 
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              className={`w-12 h-12 rounded-full items-center justify-center ${(messageText.trim() && !sending) ? 'bg-primary' : 'bg-primary/50'}`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MessageCircle size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white border-t border-gray-lighter p-4 items-center justify-center" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Text className="font-figtree-medium text-sm text-gray-medium">هذه التذكرة مغلقة ولا يمكن استقبال رسائل جديدة.</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
