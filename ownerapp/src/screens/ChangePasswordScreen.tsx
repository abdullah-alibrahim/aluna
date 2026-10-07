import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Lock, ShieldAlert } from 'lucide-react-native';
import { useAppDispatch } from '@/store/hooks';
import { updatePassword } from '@/store/slices/authSlice';
import { t } from '@/i18n';
import twConfig from '../../tailwind.config.js';
import CustomInput from '@/components/common/CustomInput';

const colors = twConfig.theme.extend.colors;

const ChangePasswordScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t('password.mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('password.tooShort'));
      return;
    }

    setLoading(true);
    dispatch(updatePassword({ currentPassword, newPassword }))
      .then((res) => {
        setLoading(false);
        if (res.meta.requestStatus === 'fulfilled') {
          Alert.alert(t('password.successTitle'), t('password.successMessage'), [
            { text: t('common.ok'), onPress: () => navigation.goBack() }
          ]);
        } else {
          setError(res.payload as string);
        }
      });
  };

  const isFormValid = currentPassword.trim() && newPassword.trim() && confirmPassword.trim();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
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
        <Text className="font-figtree-bold text-lg text-black-main ml-4 flex-1">{t('password.title')}</Text>
      </View>

      <KeyboardAwareScrollView 
        bottomOffset={20}
        contentContainerStyle={{ flexGrow: 1, padding: 12, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mt-6 mb-8">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Lock size={32} color="#B59451" />
          </View>
          <Text className="font-figtree-bold text-2xl text-black-main text-center">
            {t('password.secureTitle')}
          </Text>
          <Text className="font-figtree-medium text-gray-medium text-center mt-2 text-sm px-4">
            {t('password.secureSubtitle')}
          </Text>
        </View>

        {error && (
          <View className="bg-red-50 p-4 rounded-2xl mb-6 flex-row items-center border border-red-100">
            <ShieldAlert size={20} color={colors.error.DEFAULT} />
            <Text className="font-figtree-medium text-red-500 ml-2 flex-1">{error}</Text>
          </View>
        )}

        <View className="bg-white rounded-3xl p-4 border border-gray-lighter shadow-sm shadow-black/5">
          <View className="mb-3">
            <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">{t('password.current')}</Text>
            <CustomInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('password.currentPlaceholder')}
              secureTextEntry
              icon={<Lock size={20} color={colors['gray-dark']} />}
            />
          </View>

          <View className="mb-3">
            <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">{t('password.new')}</Text>
            <CustomInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('password.newPlaceholder')}
              secureTextEntry
              icon={<Lock size={20} color={colors['gray-dark']} />}
            />
          </View>

          <View className="mb-2">
            <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">{t('password.confirm')}</Text>
            <CustomInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('password.confirmPlaceholder')}
              secureTextEntry
              icon={<Lock size={20} color={colors['gray-dark']} />}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View 
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-lighter px-3 py-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity 
          onPress={handleSave}
          disabled={loading || !isFormValid}
          className={`h-14 rounded-full flex-row items-center justify-center ${(loading || !isFormValid) ? 'bg-primary/50' : 'bg-primary shadow-sm shadow-primary/30'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-figtree-bold text-white text-lg">{t('password.update')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;
