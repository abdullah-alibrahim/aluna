import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAppDispatch } from '@/store/hooks';
import { signOutUser, syncEmailVerification } from '@/store/slices/authSlice';
import PrimaryButton from '@/components/common/PrimaryButton';
import { auth } from '@/config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { t } from '@/i18n';

const VerificationScreen = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage(t('verification.resent'));
    } catch (error: any) {
      setMessage(error.message || t('verification.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await dispatch(syncEmailVerification());
      if (syncEmailVerification.fulfilled.match(result)) {
        setMessage(t('verification.success'));
      } else {
        setMessage((result.payload as string) || t('verification.notYet'));
      }
    } catch (error: any) {
      setMessage(error.message || t('verification.checkFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View 
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAwareScrollView 
        bottomOffset={20}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 items-center mt-5">
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
            className="mb-3"
          />
          <Text className="text-black-main text-4xl font-figtree-bold mb-2 tracking-tight text-center">
            {t('verification.title')}
          </Text>
          <Text className="text-gray-medium text-center font-figtree text-base mb-2">
            {t('verification.subtitle')}
          </Text>
        </View>

        {message ? (
          <View className="bg-primary/10 p-4 rounded-xl mb-6">
            <Text className="text-primary font-figtree-semibold text-center">{message}</Text>
          </View>
        ) : null}

        <View className="space-y-4 w-full mt-4">
          <PrimaryButton 
            title={t('verification.iveVerified')} 
            onPress={handleCheckVerification} 
            loading={loading}
          />
          <View className="h-4" />
          <PrimaryButton 
            title={t('verification.resend')} 
            variant="outline"
            onPress={handleResend} 
            disabled={loading}
          />
          <View className="h-4" />
          <PrimaryButton 
            title={t('common.logout')} 
            variant="outline"
            onPress={() => dispatch(signOutUser())} 
            disabled={loading}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default VerificationScreen;
