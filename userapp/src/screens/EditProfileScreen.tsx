import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Camera, User, Mail, ShieldAlert } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateMyProfile } from '@/store/slices/authSlice';
import twConfig from '../../tailwind.config.js';
import CustomInput from '@/components/common/CustomInput';
import { t } from '@/i18n';

import { API_URL } from '../api/client';

const colors = twConfig.theme.extend.colors;

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const getImageUrl = (url: string | undefined | null) => {
    if (!url) return `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=B59451&color=fff&bold=true`;
    if (url.startsWith('http')) return url;
    const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
    return `${baseUrl}${url}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    dispatch(updateMyProfile({ name, email, imageUri: imageUri || undefined })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        navigation.goBack();
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View 
        className="px-3 flex-row items-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center bg-background rounded-full"
        >
          <ChevronLeft size={24} color={colors['black-main']} />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-lg text-black-main ml-4 flex-1">{t('profile.editProfile')}</Text>
      </View>

      <KeyboardAwareScrollView 
        bottomOffset={20}
        contentContainerStyle={{ flexGrow: 1, padding: 12, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View className="items-center mt-3 mb-3">
          <TouchableOpacity onPress={pickImage} className="relative">
            <Image 
              source={{ uri: imageUri || getImageUrl(user?.avatar || user?.profilePicture) }}
              className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 shadow-sm shadow-black/10"
            />
            <View className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-white shadow-sm">
              <Camera size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text className="font-figtree-medium text-gray-medium mt-4 text-sm">{t('editProfile.tapToChange')}</Text>
        </View>

        {error && (
          <View className="bg-red-50 p-4 rounded-2xl mb-6 flex-row items-center border border-red-100">
            <ShieldAlert size={20} color={colors.error.DEFAULT} />
            <Text className="font-figtree-medium text-red-500 ml-2 flex-1">{error}</Text>
          </View>
        )}

        {/* Form Section */}
        <View className="bg-white rounded-3xl p-4 border border-gray-lighter shadow-sm shadow-black/5">
          <Text className="font-figtree-bold text-black-main text-lg mb-5">{t('editProfile.personalInfo')}</Text>

          <View className="mb-3">
            <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">{t('auth.fullName')}</Text>
            <CustomInput
              value={name}
              onChangeText={setName}
              placeholder={t('editProfile.fullNamePlaceholder')}
              icon={<User size={20} color={colors['gray-dark']} />}
            />
          </View>

          <View className="mb-2">
            <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">{t('auth.email')}</Text>
            <CustomInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('editProfile.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={colors['gray-dark']} />}
            />
            <Text className="font-figtree-medium text-xs text-gray-medium mt-2 ml-1">
              {t('editProfile.emailHint')}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky Footer */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-lighter px-3 py-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity 
          onPress={handleSave}
          disabled={loading || !name.trim() || !email.trim()}
          className={`h-14 rounded-full flex-row items-center justify-center ${(loading || !name.trim() || !email.trim()) ? 'bg-primary/50' : 'bg-primary shadow-sm shadow-primary/30'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-figtree-bold text-white text-lg">{t('editProfile.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;
