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
import { Eye, EyeOff, Lock, Phone, User } from 'lucide-react-native';
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

const GENDER_OPTIONS = [
  { value: 'Male', labelKey: 'auth.male' },
  { value: 'Female', labelKey: 'auth.female' },
];

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('');

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const handleRegister = () => {
    if (!name || !phone || !password) return;
    dispatch(register({ name, phone, password, gender, role: 'owner' }));
  };

  return (
    <View 
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAwareScrollView 
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 items-center mt-5">
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 160, height: 160, backgroundColor: 'transparent' }}
            resizeMode="contain"
            className="mb-4"
          />
          <Text className="text-black-main text-4xl font-figtree-bold mb-2 tracking-tight">{t('auth.ownerRegisterTitle')}</Text>
          <Text className="text-gray-medium text-base font-figtree text-center px-2">{t('auth.ownerRegisterSubtitle')}</Text>
        </View>

        {error && (
          <View className="bg-error-light border border-error/20 p-4 rounded-3xl mb-6">
            <Text className="text-error font-figtree text-center">{error}</Text>
          </View>
        )}

        <View className="space-y-3">
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

          <CustomInput 
            containerClassName="mt-3"
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

          <Text className="text-gray-medium font-figtree mb-2 mt-4 px-1">{t('auth.genderOptional')}</Text>
          <View className="flex-row gap-3">
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setGender(option.value)}
                className={`flex-1 py-3 rounded-2xl items-center border ${
                  gender === option.value 
                    ? 'bg-primary border-primary' 
                    : 'bg-white border-gray-lighter'
                }`}
              >
                <Text className={`font-figtree-bold ${
                  gender === option.value ? 'text-white' : 'text-gray-dark'
                }`}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton 
          title={t('auth.createAccount')}
          onPress={handleRegister}
          disabled={!name || !phone || !password}
          loading={loading}
          className="mt-8 mb-6"
        />

        <Pressable 
          className="items-center py-2"
          onPress={() => navigation.navigate('Login')}
          hitSlop={12}
        >
          <Text className="text-gray-medium font-figtree">
            {t('auth.alreadyHaveAccount')} <Text className="text-primary font-figtree-bold">{t('auth.login')}</Text>
          </Text>
        </Pressable>

      </KeyboardAwareScrollView>
    </View>
  );
};

export default RegisterScreen;
