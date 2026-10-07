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
import { Phone, ArrowLeft } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { forgotPassword, clearError } from '@/store/slices/authSlice';
import CustomInput from '@/components/common/CustomInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { t } from '@/i18n';
import twConfig from '../../tailwind.config.js';

const colors = twConfig.theme.extend.colors;

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [isSent, setIsSent] = useState(false);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const handleReset = async () => {
    if (!phone) return;
    const result = await dispatch(forgotPassword(phone));
    if (forgotPassword.fulfilled.match(result)) {
      setIsSent(true);
    }
  };

  return (
    <View 
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="px-6 pt-0 pb-2 z-10">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-lighter shadow-sm shadow-black/5"
          hitSlop={12}
        >
          <ArrowLeft color={colors['black-main']} size={20} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView 
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 items-center mt-3">
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 160, height: 160, backgroundColor: 'transparent' }}
            resizeMode="contain"
            className="mb-4"
          />
          <Text className="text-black-main text-4xl font-figtree-bold mb-2 tracking-tight text-center">
            {t('auth.resetTitle')}
          </Text>
          <Text className="text-gray-medium text-base font-figtree text-center">
            {t('auth.resetSubtitle')}
          </Text>
        </View>

        {error && (
          <View className="bg-error-light border border-error/20 p-4 rounded-3xl mb-6">
            <Text className="text-error font-figtree text-center">{error}</Text>
          </View>
        )}

        {isSent ? (
          <View className="bg-success-light border border-success/20 p-6 rounded-[24px] mb-6 items-center shadow-sm shadow-black/5">
            <Text className="text-success font-figtree-bold text-lg mb-2">{t('auth.checkEmail')}</Text>
            <Text className="text-success font-figtree text-center">
              {t('auth.resetSent')} {phone}
            </Text>
            <Pressable 
              className="mt-6"
              onPress={() => navigation.navigate('Login')}
              hitSlop={12}
            >
              <Text className="text-primary font-figtree-bold">{t('auth.returnToLogin')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
            </View>

            <PrimaryButton 
              title={t('auth.sendReset')}
              onPress={handleReset}
              disabled={!phone}
              loading={loading}
              className="mt-3 mb-3"
            />
          </>
        )}

      </KeyboardAwareScrollView>
    </View>
  );
};

export default ForgotPasswordScreen;
