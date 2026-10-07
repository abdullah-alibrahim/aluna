import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Settings as SettingsIcon,
  Percent,
  CheckCircle2,
  Save,
  DollarSign,
  ChevronDown,
  X
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSettings, updateSettings, clearUpdateStatus } from '@/store/slices/settingSlice';
import { t } from '@/i18n';

const CURRENCIES = [
  { code: 'SYP', symbol: 'ل.س', name: 'الليرة السورية', flag: '🇸🇾' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'يورو', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'جنيه إسترليني', flag: '🇬🇧' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', flag: '🇸🇦' },
  { code: 'TRY', symbol: '₺', name: 'ليرة تركية', flag: '🇹🇷' },
  { code: 'JPY', symbol: '¥', name: 'ين ياباني', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'دولار كندي', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'دولار أسترالي', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'روبية هندية', flag: '🇮🇳' },
];

const AdminSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { settings, loading, error, updateLoading, updateError, updateSuccess } = useAppSelector((state) => state.settings);

  const [commissionRate, setCommissionRate] = useState('');
  const [currency, setCurrency] = useState('ل.س');
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setCommissionRate(settings.platformCommissionRate ? settings.platformCommissionRate.toString() : '0');
      setCurrency(settings.currency || 'ل.س');
    }
  }, [settings]);

  useEffect(() => {
    if (updateSuccess) {
      Alert.alert(t('common.success'), t('adminScreens.settingsUpdated'));
      dispatch(clearUpdateStatus());
    }
    if (updateError) {
      Alert.alert(t('common.error'), updateError);
      dispatch(clearUpdateStatus());
    }
  }, [updateSuccess, updateError, dispatch]);

  const handleSave = () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      Alert.alert(t('common.validationError'), t('adminScreens.commissionRateInvalid'));
      return;
    }

    dispatch(updateSettings({
      platformCommissionRate: rate,
      currency: currency.trim() || 'ل.س',
    }));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center px-3 py-4 bg-background z-10">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
          >
            <ArrowLeft size={20} color="#14110A" />
          </TouchableOpacity>
          <Text className="font-figtree-bold text-xl text-black-main">{t('adminScreens.platformSettings')}</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        >
          {loading && !settings ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#B59451" />
            </View>
          ) : error && !settings ? (
            <View className="py-20 items-center justify-center">
              <Text className="font-figtree-medium text-rose-500 text-center">{error}</Text>
            </View>
          ) : (
            <>
              {/* Intro Section */}
              <View className="bg-white p-4 rounded-3xl mb-2 border border-gray-lighter shadow-sm shadow-black/5">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <SettingsIcon size={20} color="#B59451" />
                  </View>
                  <Text className="font-figtree-bold text-lg text-black-main">{t('adminScreens.globalConfiguration')}</Text>
                </View>
                <Text className="font-figtree-regular text-sm text-gray-medium leading-5">
                  {t('adminScreens.globalConfigurationDesc')}
                </Text>
              </View>

              {/* Financial Settings */}
              <Text className="font-figtree-bold text-lg text-black-main mb-3 ml-1">{t('adminScreens.financialSetup')}</Text>
              <View className="bg-white p-5 rounded-3xl mb-3 border border-gray-lighter shadow-sm shadow-black/5">
                <Text className="font-figtree-semibold text-sm text-gray-dark mb-2">{t('adminScreens.platformCommissionRate')}</Text>
                <View className="flex-row items-center bg-background rounded-2xl border border-gray-lighter px-3 h-12">
                  <Percent size={20} color="#9C8C80" className="mr-3" />
                  <TextInput
                    value={commissionRate}
                    onChangeText={setCommissionRate}
                    keyboardType="numeric"
                    className="flex-1 font-figtree-bold text-black-main text-base"
                    placeholder="مثال: 15"
                    placeholderTextColor="#D1D5DB"
                  />
                </View>
                <Text className="font-figtree-regular text-xs text-gray-medium mt-2 ml-1">
                  {t('adminScreens.commissionRateHint')}
                </Text>
                
                <Text className="font-figtree-semibold text-sm text-gray-dark mt-4 mb-2">{t('adminScreens.platformCurrencySymbol')}</Text>
                <TouchableOpacity 
                  onPress={() => setCurrencyModalVisible(true)}
                  className="flex-row items-center justify-between bg-background rounded-2xl border border-gray-lighter px-4 h-12"
                >
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-3">{CURRENCIES.find(c => c.symbol === currency)?.flag || '🌐'}</Text>
                    <Text className="font-figtree-bold text-black-main text-base">
                      {currency} - {CURRENCIES.find(c => c.symbol === currency)?.name || t('adminScreens.custom')}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#9C8C80" />
                </TouchableOpacity>
                <Text className="font-figtree-regular text-xs text-gray-medium mt-2 ml-1">
                  {t('adminScreens.platformCurrencyHint')}
                </Text>
              </View>

            </>
          )}
        </ScrollView>
      </View>

      {/* Save Button */}
      <View 
        className="absolute bottom-0 w-full bg-white border-t border-gray-lighter px-4 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <TouchableOpacity 
          onPress={handleSave}
          disabled={updateLoading}
          className={`w-full h-12 gap-2 rounded-full flex-row items-center justify-center ${updateLoading ? 'bg-primary/50' : 'bg-primary shadow-lg shadow-primary/30'}`}
        >
          {updateLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" className="mr-2" />
              <Text className="font-figtree-bold text-white text-lg">{t('adminScreens.saveConfiguration')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-[32px] p-5 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom + 20, 40), maxHeight: '80%' }}>
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-figtree-bold text-xl text-black-main">{t('adminScreens.selectCurrency')}</Text>
              <TouchableOpacity 
                onPress={() => setCurrencyModalVisible(false)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {CURRENCIES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => {
                    setCurrency(item.symbol);
                    setCurrencyModalVisible(false);
                  }}
                  className={`flex-row items-center justify-between p-4 bg-white rounded-2xl mb-3 border ${currency === item.symbol ? 'border-primary' : 'border-gray-lighter'} shadow-sm shadow-black/5`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-4">{item.flag}</Text>
                    <View>
                      <Text className="font-figtree-bold text-base text-black-main">{item.name}</Text>
                      <Text className="font-figtree-medium text-xs text-gray-medium">{item.code}</Text>
                    </View>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-background items-center justify-center">
                    <Text className="font-figtree-bold text-lg text-black-main">{item.symbol}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AdminSettingsScreen;
