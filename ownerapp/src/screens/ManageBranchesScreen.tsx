import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Plus, MapPin } from 'lucide-react-native';
import apiClient from '@/api/client';

export default function ManageBranchesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const shop = route.params?.shop;
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/owner/shops/${shop._id}/branches`);
      setBranches(res.data);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shop?._id]);

  const addBranch = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('تنبيه', 'الاسم والعنوان مطلوبان');
      return;
    }
    const coords = shop.location?.coordinates || [36.2765, 33.5138];
    setSaving(true);
    try {
      await apiClient.post(`/owner/shops/${shop._id}/branches`, {
        name: name.trim(),
        address: address.trim(),
        cityId: typeof shop.cityId === 'object' ? shop.cityId._id : shop.cityId,
        longitude: coords[0],
        latitude: coords[1],
      });
      setName('');
      setAddress('');
      await load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل إضافة الفرع');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (branch: any, isActive: boolean) => {
    try {
      await apiClient.patch(`/owner/shops/${shop._id}/branches/${branch._id}`, { isActive });
      await load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل التحديث');
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-3 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white border border-gray-lighter items-center justify-center">
          <ArrowLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-lg text-black-main">فروع {shop?.name}</Text>
        <View className="w-10" />
      </View>

      <View className="px-3 mb-3 bg-white rounded-3xl border border-gray-lighter p-4 mx-3">
        <Text className="font-figtree-bold text-base text-black-main mb-2">إضافة فرع</Text>
        <TextInput value={name} onChangeText={setName} placeholder="اسم الفرع" textAlign="right" className="border border-gray-lighter rounded-xl px-3 py-2 mb-2 font-figtree-medium" />
        <TextInput value={address} onChangeText={setAddress} placeholder="العنوان" textAlign="right" className="border border-gray-lighter rounded-xl px-3 py-2 mb-3 font-figtree-medium" />
        <TouchableOpacity onPress={addBranch} disabled={saving} className="bg-primary py-3 rounded-full items-center flex-row justify-center gap-2">
          {saving ? <ActivityIndicator color="#fff" /> : <><Plus size={18} color="#fff" /><Text className="text-white font-figtree-bold">إضافة</Text></>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#B59451" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-3xl border border-gray-lighter p-4 mb-3">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-figtree-bold text-base text-black-main">{item.name}{item.isMain ? ' · رئيسي' : ''}</Text>
                <Switch value={!!item.isActive} onValueChange={(v) => toggleActive(item, v)} />
              </View>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color="#9C8C80" />
                <Text className="font-figtree-medium text-sm text-gray-dark flex-1">{item.address}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text className="text-center text-gray-medium mt-10">لا فروع بعد</Text>}
        />
      )}
    </View>
  );
}
