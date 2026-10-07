import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { ArrowLeft, Sparkles, Wand2, ScanFace, ArrowRight, BotMessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { exitGuestForAuth } from '@/store/slices/authSlice';
import twConfig from '../../tailwind.config.js';

const { width } = Dimensions.get('window');
const colors = twConfig.theme.extend.colors;

type Props = NativeStackScreenProps<RootStackParamList, 'AIScreen'>;

export default function AIScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isGuest, isAuthenticated } = useAppSelector((state) => state.auth);

  const requireAuth = () => {
    if (isGuest || !isAuthenticated) {
      dispatch(exitGuestForAuth('Login'));
      return false;
    }
    return true;
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 10 }} className="bg-background z-10 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
        >
          <ArrowLeft color="#14110A" size={20} />
        </TouchableOpacity>
        <View className="flex-row items-center bg-[#1a1a2e] px-3 py-1.5 rounded-full">
          <Sparkles color="#FFFFFF" size={14} />
          <Text className="text-white font-figtree-bold text-xs ml-1">Aluna AI</Text>
        </View>
        <View className="w-10" />
      </View>

      <View className="px-3 pt-2 pb-2">
        <Animated.Text entering={FadeInDown.duration(600).springify()} className="text-[24px] font-figtree-bold text-black-main mb-1.5 px-1">
          مساعدتك الشخصية للأناقة
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(600).delay(100).springify()} className="text-[15px] font-figtree-medium text-gray-medium mb-8 leading-[22px] px-1 pr-6">
          مدعومة بالذكاء الاصطناعي. اطلبي نصائح مخصّصة أو ارفعي صورة لتحليل أي إطلالة.
        </Animated.Text>

        {/* Feature 1: Style Consultant */}
        <Animated.View entering={FadeInRight.duration(600).delay(200).springify()}>
          <TouchableOpacity 
            onPress={() => {
              if (!requireAuth()) return;
              navigation.navigate('AIChatScreen');
            }}
            activeOpacity={0.85}
            className="mb-3 rounded-[32px] overflow-hidden shadow-lg shadow-black/10"
          >
            <LinearGradient
              colors={['#14110A', '#2A2416']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6 relative"
            >
              {/* Decorative Background Icon */}
              <View className="absolute -right-6 -bottom-6 opacity-5">
                <BotMessageSquare color="#FFFFFF" size={140} />
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/5">
                  <BotMessageSquare color="#FFFFFF" size={22} />
                </View>
                <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                  <ArrowRight color="#FFFFFF" size={16} opacity={0.6} />
                </View>
              </View>
              
              <Text className="text-white font-figtree-bold text-[24px] mb-2">مستشارة الأناقة</Text>
              <Text className="text-white/70 font-figtree-medium text-[14px] leading-[22px] pr-4">
                تحدثي مع خبيرة الجمال الذكية. احصلي على نصائح مخصّصة لشكل وجهك ونوع شعرك وأسلوب حياتك.
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Feature 2: Decode a Look */}
        <Animated.View entering={FadeInRight.duration(600).delay(300).springify()}>
          <TouchableOpacity 
            onPress={() => {
              if (!requireAuth()) return;
              navigation.navigate('AIVisionScreen');
            }}
            activeOpacity={0.85}
            className="mb-4 rounded-[32px] overflow-hidden shadow-md shadow-black/5 border-[1.5px] border-primary/20"
          >
            <LinearGradient
              colors={['#FFF8F5', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6 relative"
            >
              {/* Decorative Background Icon */}
              <View className="absolute -right-6 -bottom-6 opacity-[0.03]">
                <ScanFace color="#B59451" size={140} />
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/5">
                  <ScanFace color="#B59451" size={22} />
                </View>
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                  <ArrowRight color="#14110A" size={16} opacity={0.4} />
                </View>
              </View>

              <Text className="text-black-main font-figtree-bold text-[24px] mb-2">فكّي شفرة الإطلالة</Text>
              <Text className="text-gray-dark font-figtree-medium text-[14px] leading-[22px] pr-4">
                ارفعي صورة من بنترست أو إنستغرام. سيحللها الذكاء الاصطناعي ويخبركِ بما تطلبينه من المتخصصة.
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}
