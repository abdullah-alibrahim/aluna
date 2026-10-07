// @ts-nocheck
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react-native';
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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    if (!phone || !password) return;
    dispatch(login({ phone, password }));
  };

  return (
    <View 
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAwareScrollView 
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 items-center mt-5">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 160, height: 160, backgroundColor: 'transparent' }}
            resizeMode="contain"
            className="mb-3"
          />
          <Text className="text-black-main text-4xl font-figtree-bold mb-2 tracking-tight">{t('auth.ownerTitle')}</Text>
          <Text className="text-gray-medium text-base font-figtree text-center px-4">{t('auth.ownerSubtitle')}</Text>
        </View>

        {error && (
          <View className="bg-error-light border border-error/20 p-4 rounded-3xl mb-3">
            <Text className="text-error font-figtree text-center">{error}</Text>
          </View>
        )}

        <View className="space-y-3">
          <CustomInput
            icon={<Phone color={colors.gray.medium} size={20} strokeWidth={1.5} />}
            placeholder={t('auth.phone')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
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
        </View>

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
          disabled={!phone || !password}
          loading={loading}
          className="mb-6"
        />

        <Pressable
          className="items-center py-2"
          onPress={() => navigation.navigate('Register')}
          hitSlop={12}
        >
          <Text className="text-gray-medium font-figtree">
            {t('auth.noAccount')} <Text className="text-primary font-figtree-bold">{t('auth.createOne')}</Text>
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default LoginScreen;
