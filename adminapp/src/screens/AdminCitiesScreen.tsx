import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, X, MapPin, Edit2 } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCities, addCity, updateCity, clearCityError, City } from '@/store/slices/citySlice';
import { t } from '@/i18n';

const AdminCitiesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { cities, loading, error, addLoading, addError } = useAppSelector((state) => state.cities);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [editingCity, setEditingCity] = useState<City | null>(null);

  useEffect(() => {
    dispatch(fetchCities());
  }, [dispatch]);

  useEffect(() => {
    if (addError) {
      Alert.alert(t('common.error'), addError);
      dispatch(clearCityError());
    }
  }, [addError, dispatch]);

  const resetForm = () => {
    setName('');
    setLatitude('');
    setLongitude('');
    setEditingCity(null);
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (city: City) => {
    setEditingCity(city);
    setName(city.name);
    const [lng, lat] = city.coordinates?.coordinates || [0, 0];
    setLongitude(String(lng ?? ''));
    setLatitude(String(lat ?? ''));
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.validationError') || t('common.error'), 'اسم المدينة مطلوب');
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert(t('common.error'), 'أدخلي إحداثيات صحيحة (خط العرض والطول)');
      return;
    }

    const cityData = { name: name.trim(), latitude: lat, longitude: lng };

    if (editingCity) {
      const result = await dispatch(updateCity({ id: editingCity._id, cityData }));
      if (updateCity.fulfilled.match(result)) {
        setModalVisible(false);
        resetForm();
      }
    } else {
      const result = await dispatch(addCity(cityData));
      if (addCity.fulfilled.match(result)) {
        setModalVisible(false);
        resetForm();
      }
    }
  };

  const renderItem = ({ item }: { item: City }) => {
    const [lng, lat] = item.coordinates?.coordinates || [];
    return (
      <TouchableOpacity
        onPress={() => openEdit(item)}
        className="bg-white mx-3 mb-3 p-4 rounded-3xl border border-gray-lighter flex-row items-center"
      >
        <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-3">
          <MapPin size={22} color="#B59451" />
        </View>
        <View className="flex-1">
          <Text className="font-figtree-bold text-base text-black-main">{item.name}</Text>
          <Text className="font-figtree-medium text-xs text-gray-medium mt-1">
            {lat != null && lng != null ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : '—'}
          </Text>
          <View
            className={`self-start mt-2 px-2 py-0.5 rounded-full ${
              item.isActive ? 'bg-success-light' : 'bg-error-light'
            }`}
          >
            <Text
              className={`font-figtree-bold text-[10px] ${
                item.isActive ? 'text-success' : 'text-error'
              }`}
            >
              {item.isActive ? 'نشطة' : 'موقوفة'}
            </Text>
          </View>
        </View>
        <Edit2 size={18} color="#9C8C80" />
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-3 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter"
        >
          <ArrowLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-xl text-black-main">إدارة المدن</Text>
        <TouchableOpacity
          onPress={openCreate}
          className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading && cities.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B59451" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-figtree-medium text-error text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => dispatch(fetchCities())}
            className="bg-primary px-6 py-3 rounded-full"
          >
            <Text className="font-figtree-bold text-white">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-6">
              <MapPin size={48} color="#D1C9C0" />
              <Text className="font-figtree-bold text-lg text-black-main mt-4">لا توجد مدن</Text>
              <Text className="font-figtree-medium text-sm text-gray-medium text-center mt-2">
                أضيفي مدينة سورية لبدء ظهور الصالونات حسب الموقع.
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            className="bg-background rounded-t-[32px] p-5"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-figtree-bold text-xl text-black-main">
                {editingCity ? 'تعديل مدينة' : 'إضافة مدينة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                className="w-9 h-9 rounded-full bg-white items-center justify-center border border-gray-lighter"
              >
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>

            <Text className="font-figtree-medium text-xs text-gray-medium mb-1">اسم المدينة</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="مثال: دمشق"
              placeholderTextColor="#9C8C80"
              className="bg-white border border-gray-lighter rounded-2xl px-4 py-3 font-figtree-medium text-base text-black-main mb-3"
              textAlign="right"
            />

            <Text className="font-figtree-medium text-xs text-gray-medium mb-1">خط العرض (Latitude)</Text>
            <TextInput
              value={latitude}
              onChangeText={setLatitude}
              placeholder="33.5138"
              keyboardType="decimal-pad"
              placeholderTextColor="#9C8C80"
              className="bg-white border border-gray-lighter rounded-2xl px-4 py-3 font-figtree-medium text-base text-black-main mb-3"
            />

            <Text className="font-figtree-medium text-xs text-gray-medium mb-1">خط الطول (Longitude)</Text>
            <TextInput
              value={longitude}
              onChangeText={setLongitude}
              placeholder="36.2765"
              keyboardType="decimal-pad"
              placeholderTextColor="#9C8C80"
              className="bg-white border border-gray-lighter rounded-2xl px-4 py-3 font-figtree-medium text-base text-black-main mb-5"
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={addLoading}
              className={`py-4 rounded-full items-center ${addLoading ? 'bg-primary/60' : 'bg-primary'}`}
            >
              {addLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="font-figtree-bold text-white text-base">
                  {editingCity ? 'حفظ التعديلات' : 'إضافة المدينة'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default AdminCitiesScreen;
