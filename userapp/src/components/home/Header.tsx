import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bell, Sparkles, MapPin, ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

interface HeaderProps {
  user: any;
  unreadCount?: number;
  selectedCity?: { _id: string; name: string } | null;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
}

export default function Header({ user, unreadCount = 0, selectedCity, onLocationPress, onNotificationPress }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View className="flex-row items-center justify-between px-3 py-4">
      <View className="flex-row items-center">
        <Image
          source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=11' }}
          className="w-12 h-12 rounded-full mr-3 border border-gray-lighter"
        />
        <View>
          <Text className="text-gray-medium font-figtree text-xs mb-0.5">الموقع</Text>
          <TouchableOpacity 
            className="flex-row gap-1 items-center" 
            onPress={onLocationPress}
            activeOpacity={0.7}
          >
            <MapPin color="#B59451" size={14} strokeWidth={2.5} className="mr-1" />
            <Text className="text-black-main font-figtree-bold text-[15px] mr-0">
              {selectedCity?.name || 'اختاري المدينة'}
            </Text>
            <ChevronDown color="#14110A" size={16} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity 
          className="w-11 h-11 rounded-full bg-white items-center justify-center relative shadow-sm border border-gray-lighter"
          onPress={() => {
            if (onNotificationPress) onNotificationPress();
            navigation.navigate('Notifications');
          }}
          activeOpacity={0.7}
        >
          <Bell color="#14110A" size={20} />
          {unreadCount > 0 && (
            <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-primary border border-white" />
          )}
        </TouchableOpacity>
        <AnimatedAIButton />
      </View>
    </View>
  );
}

// Internal component for the animated AI button
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

function AnimatedAIButton() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AIScreen')}>
      <Animated.View style={[animatedStyle]} className="w-11 h-11 rounded-full items-center justify-center shadow-sm overflow-hidden bg-[#1a1a2e]">
        <Sparkles color="#FFFFFF" size={20} />
      </Animated.View>
    </TouchableOpacity>
  );
}
