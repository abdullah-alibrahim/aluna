import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Camera,
  User as UserIcon,
  Mail,
  CheckCircle2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateMyProfile } from '@/store/slices/authSlice';
import twConfig from '../../tailwind.config.js';
import { API_URL } from '@/api/client';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const AdminEditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { user, loading } = useAppSelector(state => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('common.validationError'), t('adminScreens.nameEmailRequired'));
      return;
    }

    const res = await dispatch(updateMyProfile({
      name,
      email,
      imageUri: selectedImage || undefined
    }));

    if (updateMyProfile.fulfilled.match(res)) {
      Alert.alert(t('common.success'), t('adminScreens.profileUpdated'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert(t('common.error'), res.payload as string || t('adminScreens.profileUpdateFailed'));
    }
  };

  const getAvatarSource = () => {
    if (selectedImage) return { uri: selectedImage };
    if (user?.avatar) return { uri: user.avatar.startsWith('http') ? user.avatar : `${API_URL.replace('/api', '')}${user.avatar}` };
    return null;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center px-3 py-4 bg-background z-10">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
          >
            <ArrowLeft size={20} color={colors['black-main']} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="font-figtree-bold text-xl text-black-main">تعديل الملف</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10 }}>
          {/* Avatar Editor */}
          <View className="items-center mb-3 mt-3">
            <TouchableOpacity 
              onPress={handlePickImage}
              className="relative shadow-sm shadow-black/10"
              activeOpacity={0.8}
            >
              <View className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 items-center justify-center overflow-hidden">
                {getAvatarSource() ? (
                  <Image source={getAvatarSource()!} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <UserIcon size={48} color={colors.gray.medium} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full border-4 border-white items-center justify-center">
                <Camera size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="bg-white p-5 rounded-[22px] border border-gray-lighter shadow-sm shadow-black/5">
            <Text className="font-figtree-semibold text-sm text-black-main mb-2 ml-1">الاسم الكامل</Text>
            <View className="flex-row items-center bg-background rounded-2xl border border-gray-lighter px-4 h-14 mb-3">
              <UserIcon size={18} color={colors.gray.medium} className="mr-3" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="أدخلي اسمك"
                placeholderTextColor={colors.gray.light}
                className="flex-1 font-figtree-medium text-sm text-black-main"
              />
            </View>

            <Text className="font-figtree-semibold text-sm text-black-main mb-2 ml-1">البريد الإلكتروني</Text>
            <View className="flex-row items-center bg-background rounded-2xl border border-gray-lighter px-4 h-14 mb-2">
              <Mail size={18} color={colors.gray.medium} className="mr-3" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="أدخلي بريدك"
                placeholderTextColor={colors.gray.light}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 font-figtree-medium text-sm text-black-main"
              />
            </View>
          </View>

        </ScrollView>

        {/* Save Button Fixed Bottom */}
        <View className="px-5 pt-5 bg-background border-t border-gray-lighter" style={{ paddingBottom: insets.bottom + 20 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="h-14 bg-black-main rounded-full flex-row items-center justify-center shadow-lg shadow-black/20"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <CheckCircle2 size={20} color="#FFF" className="mr-2" />
                <Text className="font-figtree-bold text-base text-white">حفظ التغييرات</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AdminEditProfileScreen;
