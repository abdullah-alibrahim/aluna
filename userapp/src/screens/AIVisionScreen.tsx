import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { ArrowLeft, Sparkles, Image as ImageIcon, Upload, Scissors, Droplets, Clock, Info, CheckCircle2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import twConfig from '../../tailwind.config.js';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { analyzeLook, clearVisionAnalysis } from '@/store/slices/aiSlice';

const colors = twConfig.theme.extend.colors;

type Props = NativeStackScreenProps<RootStackParamList, 'AIVisionScreen'>;

export default function AIVisionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { visionAnalysis: analysis, isVisionAnalyzing: isAnalyzing } = useAppSelector((state) => state.ai);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true, // Crucial for Gemini API
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      dispatch(clearVisionAnalysis());
    }
  };

  const handleAnalyze = async () => {
    if (!base64) return;
    dispatch(analyzeLook(base64));
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 5, paddingHorizontal: 12, paddingBottom: 10 }} className="bg-background flex-row items-center justify-between z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
        >
          <ArrowLeft color="#14110A" size={20} />
        </TouchableOpacity>
        <View className="items-center">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <Sparkles color={colors.primary} size={16} />
            <Text className="text-black-main font-figtree-bold text-lg">فكّي شفرة الإطلالة</Text>
          </View>
          <Text className="text-gray-medium font-figtree-medium text-[10px] uppercase tracking-widest">تحليل بالذكاء الاصطناعي</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1 px-3"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-figtree-medium text-[15px] text-gray-dark text-center mb-3 px-3 leading-[22px]">
          ارفعي صورة لقصة شعر تعجبك. سيحللها الذكاء الاصطناعي ويخبركِ بما تطلبينه من المتخصصة.
        </Text>

        {!imageUri ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <TouchableOpacity 
              onPress={pickImage}
              activeOpacity={0.7}
              className="w-full aspect-[4/5] bg-white border-[1.5px] border-dashed border-primary/30 rounded-[32px] items-center justify-center shadow-sm shadow-black/5"
            >
              <View className="w-[52px] h-[52px] rounded-full bg-primary/10 items-center justify-center mb-3">
                <ImageIcon color={colors.primary} size={28} />
              </View>
              <Text className="font-figtree-bold text-xl text-black-main mb-1.5">ارفعي صورة</Text>
              <Text className="font-figtree-medium text-[13px] text-gray-medium">من المعرض أو الكاميرا</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} className="w-full items-center">
            <View className="w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-white shadow-sm shadow-black/5 border border-gray-lighter mb-3 relative">
              <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
              
              <TouchableOpacity 
                onPress={pickImage}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 items-center justify-center backdrop-blur-md"
              >
                <Upload color="#FFF" size={18} />
              </TouchableOpacity>
            </View>

            {!analysis && (
              <TouchableOpacity 
                onPress={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-primary h-14 rounded-2xl items-center justify-center flex-row shadow-sm shadow-primary/30"
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator color="#FFF" className="mr-2" />
                    <Text className="text-white font-figtree-bold text-lg">جاري التحليل...</Text>
                  </>
                ) : (
                  <>
                    <Sparkles color="#FFF" size={20} className="mr-2" />
                    <Text className="text-white font-figtree-bold text-lg">حلّلي هذه الإطلالة</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {analysis && (
          <Animated.View entering={FadeInUp.duration(600).springify()} className="mt-3">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Sparkles color={colors.primary} size={16} />
              </View>
              <Text className="font-figtree-bold text-xl text-black-main">تحليل الذكاء الاصطناعي</Text>
            </View>
            
            <View className="bg-white p-5 rounded-[28px] border border-gray-lighter shadow-sm shadow-black/5 mb-3">
              <View className="items-center mb-6 border-b border-gray-lighter/50 pb-5">
                <Text className="font-figtree-bold text-2xl text-black-main text-center mb-2">
                  {analysis?.styleName}
                </Text>
                <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full">
                  <Scissors color={colors.primary} size={14} />
                  <Text className="font-figtree-bold text-[13px] text-primary ml-1.5">تطابق الإطلالة</Text>
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Info color={colors.primary} size={18} />
                  <Text className="font-figtree-bold text-[16px] text-black-main ml-2">ماذا تطلبين؟</Text>
                </View>
                <Text className="font-figtree-medium text-[15px] text-gray-dark leading-[24px] ml-6">
                  {analysis?.instructions}
                </Text>
              </View>

              <View className="flex-row justify-between mb-3">
                <View className="flex-1 bg-gray-50 rounded-2xl p-4 mr-2 border border-gray-lighter/50">
                  <Droplets color={colors.primary} size={20} className="mb-2" />
                  <Text className="font-figtree-medium text-[12px] text-gray-medium mb-0.5">نوع الشعر</Text>
                  <Text className="font-figtree-bold text-[14px] text-black-main leading-tight">{analysis?.hairType}</Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-2xl p-4 ml-2 border border-gray-lighter/50">
                  <Clock color={colors.primary} size={20} className="mb-2" />
                  <Text className="font-figtree-medium text-[12px] text-gray-medium mb-0.5">الصيانة</Text>
                  <Text className="font-figtree-bold text-[14px] text-black-main leading-tight">{analysis?.maintenance}</Text>
                </View>
              </View>

              {analysis?.products && analysis.products.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-3">
                    <Sparkles color={colors.primary} size={18} />
                    <Text className="font-figtree-bold text-[16px] text-black-main ml-2">منتجات مُوصى بها</Text>
                  </View>
                  {analysis.products.map((product: string, index: number) => (
                    <View key={index} className="flex-row items-center mb-2 ml-6">
                      <CheckCircle2 color={colors.primary} size={14} />
                      <Text className="font-figtree-medium text-[14px] text-gray-dark ml-2 flex-1">
                        {product}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              onPress={() => {
                setImageUri(null);
                setBase64(null);
                dispatch(clearVisionAnalysis());
              }}
              className="mt-3 w-full bg-gray-100/80 h-14 rounded-[20px] items-center justify-center border border-gray-lighter"
            >
              <Text className="text-black-main font-figtree-bold text-[15px]">تحليل صورة أخرى</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
