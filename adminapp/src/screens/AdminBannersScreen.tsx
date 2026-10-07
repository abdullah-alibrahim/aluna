import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  Alert,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Plus,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  X
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchBanners, 
  addBanner, 
  toggleBannerStatus, 
  deleteBanner,
  Banner 
} from '@/store/slices/bannerSlice';
import dayjs from 'dayjs';
import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const AdminBannersScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { banners, loading, actionLoading } = useAppSelector(state => state.banners);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [targetLink, setTargetLink] = useState('');

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [16, 9], // Standard banner aspect ratio
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleAddBanner = async () => {
    if (!selectedImage) {
      Alert.alert(t('common.error'), t('adminScreens.bannerImageRequired'));
      return;
    }
    
    const res = await dispatch(addBanner({ imageUri: selectedImage, targetLink }));
    if (addBanner.fulfilled.match(res)) {
      setAddModalVisible(false);
      setSelectedImage(null);
      setTargetLink('');
      Alert.alert(t('common.success'), t('adminScreens.bannerAdded'));
    } else {
      Alert.alert(t('common.error'), t('adminScreens.bannerAddFailed'));
    }
  };

  const handleToggle = async (id: string) => {
    await dispatch(toggleBannerStatus(id));
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('adminScreens.deleteBanner'),
      t('adminScreens.deleteBannerConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            await dispatch(deleteBanner(id));
          } 
        }
      ]
    );
  };

  const renderBannerCard = ({ item }: { item: Banner }) => (
    <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5">
      {/* Image Preview */}
      <View className="w-full h-32 rounded-2xl overflow-hidden mb-4 bg-gray-100">
        <Image 
          source={{ uri: item.imageUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${item.isActive ? 'bg-success' : 'bg-gray-medium'}`} />
            <Text className="font-figtree-semibold text-sm text-black-main">
              {item.isActive ? 'نشط' : 'غير نشط'}
            </Text>
          </View>
          
          {item.targetLink ? (
            <View className="flex-row items-center mt-1">
              <LinkIcon size={12} color={colors.primary} className="mr-1" />
              <Text className="font-figtree-regular text-xs text-primary" numberOfLines={1}>
                {item.targetLink}
              </Text>
            </View>
          ) : (
            <Text className="font-figtree-regular text-xs text-gray-medium mt-1">بدون رابط</Text>
          )}
          
          <Text className="font-figtree-regular text-[10px] text-gray-medium mt-2">
            أُضيف في {dayjs(item.createdAt).format('D MMM YYYY')}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggle(item._id)}
            trackColor={{ false: colors.gray.lighter, true: colors.success.DEFAULT + '40' }}
            thumbColor={item.isActive ? colors.success.DEFAULT : '#f4f3f4'}
            disabled={actionLoading}
            className="mr-3"
          />
          <TouchableOpacity 
            onPress={() => handleDelete(item._id)}
            disabled={actionLoading}
            className="w-10 h-10 rounded-full bg-error/10 items-center justify-center"
          >
            <Trash2 size={18} color={colors.error.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-background z-10 ">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
          >
            <ArrowLeft size={20} color={colors['black-main']} />
          </TouchableOpacity>
          <Text className="font-figtree-bold text-xl text-black-main">إدارة البنرات</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setAddModalVisible(true)}
          className="bg-primary px-4 py-2 rounded-full flex-row items-center shadow-sm shadow-primary/30"
        >
          <Plus size={16} color="#FFF" className="mr-1" />
          <Text className="font-figtree-bold text-sm text-white">إضافة</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={banners}
          keyExtractor={item => item._id}
          renderItem={renderBannerCard}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <ImageIcon size={48} color={colors.gray.light} className="mb-4" />
              <Text className="font-figtree-medium text-gray-medium text-base text-center mb-2">لا توجد بنرات ترويجية بعد.</Text>
              <Text className="font-figtree-regular text-gray-medium text-sm text-center px-8">أضيفي بنرات لإبراز العروض أو الفعاليات في تطبيق الزبونات.</Text>
            </View>
          }
        />
      )}

      {/* Add Banner Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-[32px] p-5 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}>
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-figtree-bold text-2xl text-black-main">بنر جديد</Text>
              <TouchableOpacity 
                onPress={() => {
                  setAddModalVisible(false);
                  setSelectedImage(null);
                  setTargetLink('');
                }}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>

            {/* Image Picker */}
            <TouchableOpacity 
              onPress={handlePickImage}
              className={`w-full h-40 rounded-3xl border-2 border-dashed ${selectedImage ? 'border-primary bg-primary/5' : 'border-gray-lighter bg-white'} items-center justify-center mb-5 overflow-hidden`}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <>
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
                    <ImageIcon size={24} color={colors.primary} />
                  </View>
                  <Text className="font-figtree-medium text-sm text-primary">رفع صورة البنر</Text>
                  <Text className="font-figtree-regular text-xs text-gray-medium mt-1">المُفضّل: نسبة 16:9</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Target Link */}
            <Text className="font-figtree-semibold text-sm text-black-main mb-2 ml-1">رابط التوجيه (اختياري)</Text>
            <View className="flex-row items-center bg-white rounded-2xl border border-gray-lighter px-4 h-14 mb-6">
              <LinkIcon size={18} color={colors.gray.medium} className="mr-3" />
              <TextInput
                value={targetLink}
                onChangeText={setTargetLink}
                placeholder="مثال: https://example.com/promo"
                placeholderTextColor={colors.gray.light}
                className="flex-1 font-figtree-medium text-sm text-black-main"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleAddBanner}
              disabled={actionLoading || !selectedImage}
              className={`h-14 rounded-full items-center justify-center flex-row ${selectedImage ? 'bg-black-main' : 'bg-gray-300'}`}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="font-figtree-bold text-white text-base">رفع البنر</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminBannersScreen;
