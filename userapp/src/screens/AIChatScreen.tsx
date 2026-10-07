import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { ArrowLeft, Sparkles, Send } from 'lucide-react-native';
import twConfig from '../../tailwind.config.js';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendChatMessage, addMessageToChat } from '@/store/slices/aiSlice';

const colors = twConfig.theme.extend.colors;

type Props = NativeStackScreenProps<RootStackParamList, 'AIChatScreen'>;

export default function AIChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { chatMessages: messages, isChatTyping: isTyping } = useAppSelector((state) => state.ai);

  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');

    // Optimistically add user message to Redux
    dispatch(addMessageToChat({
      id: Date.now().toString(),
      text: userText,
      role: 'user'
    }));

    // Dispatch thunk to get AI response
    dispatch(sendChatMessage(userText));
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 5, paddingHorizontal: 12, paddingBottom: 10 }} className="bg-background flex-row items-center justify-between z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter"
        >
          <ArrowLeft color="#14110A" size={20} />
        </TouchableOpacity>
        <View className="items-center">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <Sparkles color={colors.primary} size={16} />
            <Text className="text-black-main font-figtree-bold text-lg">مستشارة الأناقة</Text>
          </View>
          <Text className="text-gray-medium font-figtree-medium text-[10px] uppercase tracking-widest">مدعومة بالذكاء الاصطناعي</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.duration(400).springify()}
              className={`mb-4 max-w-[82%] ${isUser ? 'self-end' : 'self-start'}`}
            >
              {!isUser && index === 0 && (
                <View className="flex-row items-center mb-1.5 ml-1">
                  <Sparkles color={colors.primary} size={12} />
                  <Text className="text-gray-medium font-figtree-bold text-[11px] ml-1 uppercase tracking-wider">Aluna AI</Text>
                </View>
              )}
              <View
                className={`px-5 py-3.5 rounded-[24px] ${isUser
                  ? 'bg-primary rounded-tr-sm shadow-md shadow-primary/20'
                  : 'bg-white border border-gray-lighter shadow-sm shadow-black/5 rounded-tl-sm'
                  }`}
              >
                <Text className={`font-figtree-medium text-[15px] leading-[22px] ${isUser ? 'text-white' : 'text-black-main'}`}>
                  {msg.text}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {isTyping && (
          <Animated.View entering={FadeInUp.duration(400).springify()} className="self-start mb-4 ml-1">
            <View className="bg-white px-5 py-3.5 rounded-[24px] rounded-tl-sm border border-gray-lighter shadow-sm shadow-black/5">
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View
        style={{
          // Drop the inset when keyboard is up to prevent floating gap
          paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12)
        }}
        className="px-3 pt-3 bg-background pb-2"
      >
        <View className="flex-row items-end bg-white rounded-full px-2 py-1 border border-gray-lighter shadow-sm shadow-black/5">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اكتبي رسالتك..."
            placeholderTextColor={colors.gray.medium}
            className="flex-1 font-figtree-medium text-[14px] text-black-main min-h-[34px] max-h-24 px-3 pt-3 pb-3"
            multiline
            textAlignVertical="center"
            // Force scroll to bottom when keyboard opens
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isTyping}
            className={`w-11 h-11 rounded-full items-center justify-center ml-2 mb-0.5 ${input.trim() ? 'bg-primary ' : 'bg-gray-100'}`}
          >
            <Send color={input.trim() ? '#FFF' : colors.gray.medium} size={18} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}