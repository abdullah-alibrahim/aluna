// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, clearError } from '@/store/slices/authSlice';
import CustomInput from '@/components/common/CustomInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { t } from '@/i18n';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    if (!email || !password) return;
    dispatch(login({ email, password }));
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 items-center mt-10">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 140, height: 140, marginBottom: 20, backgroundColor: 'transparent' }}
              resizeMode="contain"
            />
            <Text className="text-black-main text-3xl font-figtree-bold mb-2">
              {t('auth.adminTitle')}
            </Text>
            <Text className="text-gray-medium text-base font-figtree text-center px-4">
              {t('auth.adminSubtitle')}
            </Text>
          </View>

          {error ? (
            <View className="bg-error-light border border-error/20 p-4 rounded-3xl mb-6">
              <Text className="text-error text-center font-figtree">{error}</Text>
            </View>
          ) : null}

          <CustomInput
            icon={<Mail color={colors.gray.medium} size={20} strokeWidth={1.5} />}
            placeholder={t('auth.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) dispatch(clearError());
            }}
          />

          <CustomInput
            containerClassName="mt-3"
            icon={<Lock color={colors.gray.medium} size={20} strokeWidth={1.5} />}
            placeholder={t('auth.password')}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) dispatch(clearError());
            }}
            rightIcon={
              showPassword ? (
                <EyeOff color={colors.gray.medium} size={20} strokeWidth={1.5} />
              ) : (
                <Eye color={colors.gray.medium} size={20} strokeWidth={1.5} />
              )
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Pressable
            className="self-end mt-3 mb-5"
            onPress={() => navigation.navigate('ForgotPassword')}
            hitSlop={12}
          >
            <Text className="text-gray-medium font-figtree-medium">{t('auth.forgotPassword')}</Text>
          </Pressable>

          <PrimaryButton
            title={t('auth.loginToDashboard')}
            onPress={handleLogin}
            disabled={!email || !password}
            loading={loading}
            className="mb-6"
          />

          <Pressable
            className="items-center py-2"
            onPress={() => navigation.navigate('Register')}
            hitSlop={12}
          >
            <Text className="text-gray-medium font-figtree text-center">
              {t('auth.adminRegisterSubtitle')}
            </Text>
            <Text className="text-primary font-figtree-bold mt-1">{t('auth.createAccount')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
