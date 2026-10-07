import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { CheckCircle2 } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type SuccessRouteProp = RouteProp<RootStackParamList, 'BookingSuccess'>;

export default function BookingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SuccessRouteProp>();
  const { bookingId } = route.params;

  return (
    <View className="flex-1 bg-white items-center justify-center px-6" style={{ paddingTop: insets.top }}>
      <View className="w-24 h-24 bg-success-light rounded-full items-center justify-center mb-6 border-4 border-success/20">
        <CheckCircle2 size={48} color="#10B981" />
      </View>
      
      <Text className="text-black-main font-figtree-bold text-3xl mb-2 text-center">
        تم تأكيد الحجز!
      </Text>
      
      <Text className="text-gray-dark font-figtree-regular text-base text-center mb-10 leading-6">
        تم حجز موعدك بنجاح. يمكنك متابعة التفاصيل من تبويب الحجوزات.
      </Text>

      <TouchableOpacity 
        onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
        className="w-full bg-primary h-14 rounded-2xl items-center justify-center"
      >
        <Text className="text-white font-figtree-bold text-lg">عرض الحجوزات</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        className="w-full mt-4 h-14 rounded-2xl items-center justify-center bg-gray-50 border border-gray-lighter"
      >
        <Text className="text-black-main font-figtree-bold text-lg">العودة للرئيسية</Text>
      </TouchableOpacity>
    </View>
  );
}
