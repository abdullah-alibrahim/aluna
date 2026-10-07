// @ts-nocheck
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register, clearError } from '@/store/slices/authSlice';
import CustomInput from '@/components/common/CustomInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { t } from '@/i18n';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const handleRegister = () => {
    if (!name || !email || !password || !inviteCode) return;
    dispatch(register({ name, email, password, role: 'admin', inviteCode }));
  };

  return (
    <View 
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAwareScrollView 
        bottomOffset={20}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 items-center mt-5">
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
            className="mb-4"
          />
          <Text className="text-black-main text-4xl font-figtree-bold mb-2 tracking-tight">{t('auth.adminRegisterTitle')}</Text>
          <Text className="text-gray-medium text-base font-figtree">{t('auth.adminRegisterSubtitle')}</Text>
        </View>

        {error && (
          <View className="bg-error-light border border-error/20 p-4 rounded-3xl mb-6">
            <Text className="text-error font-figtree text-center">{error}</Text>
          </View>
        )}

        <View className="space-y-3">
          {/* Name Input */}
          <CustomInput 
            icon={<User color={colors.gray.medium} size={20} strokeWidth={1.5} />}
            placeholder={t('auth.fullName')}
            autoCapitalize="words"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) dispatch(clearError());
            }}
          />

          {/* Email Input */}
          <CustomInput 
            containerClassName="mt-3"
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

          {/* Invite Code */}
          <CustomInput 
            containerClassName="mt-3"
            icon={<Lock color={colors.gray.medium} size={20} strokeWidth={1.5} />}
            placeholder={t('auth.inviteCode')}
            autoCapitalize="none"
            value={inviteCode}
            onChangeText={(text) => {
              setInviteCode(text);
              if (error) dispatch(clearError());
            }}
          />
          <Text className="text-gray-medium font-figtree text-xs mt-1.5 ml-1">{t('auth.inviteHint')}</Text>

          {/* Password Input */}
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

        {/* Register Button */}
        <PrimaryButton 
          title={t('auth.createAccount')}
          onPress={handleRegister}
          disabled={!name || !email || !password || !inviteCode}
          loading={loading}
          className="mt-8 mb-6"
        />

        <TouchableOpacity 
          className="items-center py-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-gray-medium font-figtree">
            {t('auth.alreadyHaveAccount')} <Text className="text-primary font-figtree-bold">{t('auth.login')}</Text>
          </Text>
        </TouchableOpacity>

      </KeyboardAwareScrollView>
    </View>
  );
};

export default RegisterScreen;
