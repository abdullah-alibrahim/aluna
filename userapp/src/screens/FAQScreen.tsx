import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  HelpCircle
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchFAQs } from '@/store/slices/faqSlice';
import twConfig from '../../tailwind.config.js';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
} from 'react-native-reanimated';

const colors = twConfig.theme.extend.colors;

const FAQItem = ({ item, isExpanded, onPress }: { item: any; isExpanded: boolean; onPress: () => void }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const heightValue = useSharedValue(0);

  useEffect(() => {
    if (isExpanded && contentHeight > 0) {
      heightValue.value = withTiming(contentHeight, { duration: 300 });
    } else {
      heightValue.value = withTiming(0, { duration: 300 });
    }
  }, [isExpanded, contentHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value,
      opacity: heightValue.value > 0 ? withTiming(1, { duration: 300 }) : withTiming(0, { duration: 300 }),
    };
  });

  return (
    <View className="bg-white rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5 overflow-hidden">
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        className="p-5 flex-row justify-between items-center"
      >
        <View className="flex-row items-center flex-1 pr-4">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isExpanded ? 'bg-primary/10' : 'bg-background'}`}>
            <MessageCircleQuestion size={20} color={isExpanded ? '#B59451' : colors['gray-dark']} />
          </View>
          <Text className={`font-figtree-semibold text-base flex-1 ${isExpanded ? 'text-primary' : 'text-black-main'}`}>
            {item.question}
          </Text>
        </View>
        <View className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? 'bg-primary/10' : 'bg-gray-50'}`}>
          {isExpanded ? (
            <ChevronUp size={20} color="#B59451" />
          ) : (
            <ChevronDown size={20} color={colors['gray-dark']} />
          )}
        </View>
      </TouchableOpacity>

      <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
        <View 
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
          className="absolute top-0 left-0 right-0 p-5 pt-0"
        >
          <Text className="font-figtree-medium text-gray-medium text-sm leading-6">
            {item.answer}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const FAQScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { faqs, loading } = useAppSelector(state => state.faq);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchFAQs());
  }, [dispatch]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="px-4 flex-row items-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center bg-background rounded-full"
        >
          <ChevronLeft size={24} color={colors['black-main']} />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-lg text-black-main ml-4 flex-1">المساعدة والأسئلة</Text>
      </View>

      {/* Content */}
      {loading && faqs.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B59451" />
        </View>
      ) : (
        <FlatList 
          data={faqs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View className="mb-6 items-center">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-3">
                <HelpCircle size={32} color="#B59451" />
              </View>
              <Text className="font-figtree-bold text-2xl text-black-main text-center">
                الأسئلة الشائعة
              </Text>
              <Text className="font-figtree-medium text-gray-medium text-center mt-3 text-sm px-4 leading-5">
                إجابات عن الحجوزات والملف الشخصي والمدفوعات.
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <FAQItem 
              item={item} 
              isExpanded={expandedId === item._id}
              onPress={() => toggleExpand(item._id)}
            />
          )}
          ListEmptyComponent={() => (
            <View className="items-center py-10">
              <Text className="font-figtree-medium text-gray-medium">لا أسئلة شائعة متاحة حالياً.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default FAQScreen;
