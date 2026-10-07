import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Platform,
  Image,
  Keyboard
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTicketMessages, sendTicketMessage, addMessageRealTime, clearMessages } from '@/store/slices/ticketSlice';
import socketService from '@/api/socketService';
import { ChevronLeft, Send } from 'lucide-react-native';
import { t } from '@/i18n';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  
  const { ticketId, subject } = route.params;
  
  const { messages, messagesLoading } = useAppSelector(state => state.tickets);
  const { user, token } = useAppSelector(state => state.auth);
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Track keyboard state to dynamically remove bottom safe area inset
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
    // 1. Connect Socket
    if (token) {
      socketService.connect(token);
      socketService.joinTicketRoom(ticketId);
      
      socketService.onNewMessage((newMessage) => {
        // Only add if it's not from us (we append our own instantly optimistically, or via API response)
        // Wait, actually Redux slice deduplicates by _id. So we can just dispatch.
        dispatch(addMessageRealTime(newMessage));
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }

    // 2. Fetch history
    dispatch(fetchTicketMessages(ticketId));

    return () => {
      socketService.offNewMessage();
      dispatch(clearMessages());
    };
  }, [dispatch, ticketId, token]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');
    
    try {
      await dispatch(sendTicketMessage({ ticketId, text: textToSend })).unwrap();
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.log('Failed to send message', e);
      setInputText(textToSend); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId?._id === user?._id || item.senderId === user?._id;
    
    return (
      <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && (
          <View className="w-8 h-8 rounded-full bg-gray-200 mr-2 items-center justify-center overflow-hidden border border-gray-lighter">
            {item.senderId?.avatar ? (
              <Image source={{ uri: item.senderId.avatar }} className="w-full h-full" />
            ) : (
              <Text className="text-xs font-figtree-bold text-gray-medium">AD</Text>
            )}
          </View>
        )}
        
        <View className={`max-w-[75%] px-4 py-3 rounded-3xl ${isMe ? 'bg-primary rounded-tr-sm' : 'bg-white rounded-tl-sm border border-gray-lighter'}`}>
          <Text className={`font-figtree-medium text-base ${isMe ? 'text-white' : 'text-black-main'}`}>
            {item.text}
          </Text>
          <Text className={`font-figtree-medium text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-medium'}`}>
            {dayjs(item.createdAt).format('h:mm A')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background" 
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View 
        className="px-3 flex-row items-center bg-background"
        style={{ paddingTop: insets.top + 10, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-background border border-gray-lighter mr-3"
        >
          <ChevronLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-black-main font-figtree-bold text-lg" numberOfLines={1}>{subject}</Text>
          <Text className="text-gray-medium font-figtree-medium text-xs">محادثة الدعم</Text>
        </View>
      </View>

      {/* Messages List */}
      <View className="flex-1">
        {messagesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}
      </View>

      {/* Input Area */}
      <View 
        className="px-3 py-3 bg-white border-t border-gray-lighter flex-row items-center"
        style={{ paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12) }}
      >
        <View className="flex-1 bg-background border border-gray-lighter rounded-full flex-row items-center px-4 py-1 mr-3">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.typeMessage')}
            placeholderTextColor="#9CA3AF"
            className="flex-1 font-figtree-medium text-black-main h-10"
            multiline
            maxLength={500}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
        </View>
        
        <TouchableOpacity 
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() && !sending ? 'bg-primary ' : 'bg-gray-200'}`}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Send size={20} color={inputText.trim() ? '#FFF' : '#9CA3AF'} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
