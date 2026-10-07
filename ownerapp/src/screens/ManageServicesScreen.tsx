import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Euro,
  PoundSterling,
  IndianRupee,
  Banknote,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchServices, addService, updateService, deleteService, Service } from '@/store/slices/serviceSlice';
import { fetchCategories } from '@/store/slices/categorySlice';
import { Shop } from '@/store/slices/shopSlice';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const ManageServicesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { shop } = route.params as { shop: Shop };
  const dispatch = useAppDispatch();

  const { services, loading, actionLoading } = useAppSelector((state) => state.services);
  const { categories } = useAppSelector((state) => state.categories);
  const { settings } = useAppSelector((state) => state.settings || { settings: null });

  const currencySymbol = settings?.currency || t('common.currency');

  const getCurrencyIcon = (symbol: string, size: number, color: string) => {
    switch (symbol) {
      case '€': return <Euro size={size} color={color} />;
      case '£': return <PoundSterling size={size} color={color} />;
      case '₹': return <IndianRupee size={size} color={color} />;
      case '$': return <DollarSign size={size} color={color} />;
      default: return <Banknote size={size} color={color} />;
    }
  };

  const shopCategories = categories.filter((cat) => {
    if (!shop.categoryIds) return false;
    return shop.categoryIds.some((shopCat) => {
      if (typeof shopCat === 'string') return shopCat === cat._id;
      return shopCat._id === cat._id;
    });
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [bufferTime, setBufferTime] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  useEffect(() => {
    dispatch(fetchServices(shop._id));
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, shop._id]);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setBufferTime('0');
    setCategoryId(shopCategories.length > 0 ? shopCategories[0]._id : '');
    setImageUri(null);
    setModalVisible(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setBufferTime((service as any).bufferTime?.toString() || '0');
    setCategoryId(typeof service.categoryId === 'string' ? service.categoryId : service.categoryId._id);
    setImageUri(null); // Keep null to not update image unless selected
    setModalVisible(true);
  };

  const confirmDelete = (service: Service) => {
    setServiceToDelete(service);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await dispatch(deleteService({ shopId: shop._id, serviceId: serviceToDelete._id })).unwrap();
      setDeleteModalVisible(false);
      setServiceToDelete(null);
    } catch (err: any) {
      Alert.alert(t('common.error'), typeof err === 'string' ? err : err?.message || JSON.stringify(err) || t('common.genericError'));
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !duration || !categoryId) {
      Alert.alert(t('common.validationError'), t('common.fillRequired'));
      return;
    }

    const formData = new FormData() as any;
    formData.append('name', name);
    if (description) formData.append('description', description);
    formData.append('price', price);
    formData.append('duration', duration);
    formData.append('bufferTime', bufferTime || '0');
    formData.append('categoryId', categoryId);

    if (imageUri) {
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'service.jpg',
      });
    }

    try {
      if (editingService) {
        await dispatch(updateService({ shopId: shop._id, serviceId: editingService._id, formData })).unwrap();
      } else {
        await dispatch(addService({ shopId: shop._id, formData })).unwrap();
      }
      setModalVisible(false);
      dispatch(fetchServices(shop._id));
    } catch (err: any) {
      Alert.alert(t('common.error'), typeof err === 'string' ? err : err?.message || JSON.stringify(err) || t('common.genericError'));
    }
  };

  const renderServiceCard = ({ item }: { item: Service }) => {
    const categoryName = typeof item.categoryId === 'object' ? item.categoryId.name : t('services.unknownCategory');

    return (
      <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5 flex-row items-center gap-4">
        {item.image ? (
          <Image source={{ uri: item.image }} className="w-16 h-16 rounded-2xl bg-gray-100" />
        ) : (
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
            <ImageIcon size={24} color={colors.primary} />
          </View>
        )}

        <View className="flex-1">
          <Text className="font-figtree-bold text-[10px] text-gray-medium uppercase tracking-wider mb-0.5">{categoryName}</Text>
          <Text className="font-figtree-bold text-base text-black-main mb-1" numberOfLines={1}>{item.name}</Text>
          
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              {getCurrencyIcon(currencySymbol, 14, colors.primary)}
              <Text className="font-figtree-semibold text-sm text-black-main ml-0.5">{item.price}</Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color={colors.gray.medium} />
              <Text className="font-figtree-medium text-sm text-gray-dark ml-1">{item.duration} {t('services.minutes')}</Text>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <TouchableOpacity 
            onPress={() => openEditModal(item)}
            className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center"
          >
            <Edit2 size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => confirmDelete(item)}
            className="w-10 h-10 rounded-full bg-error-light items-center justify-center"
          >
            <Trash2 size={16} color={colors.error.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-3 flex-row items-center justify-between mb-4 mt-2">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 border border-gray-lighter shadow-sm shadow-black/5"
          >
            <ArrowLeft size={20} color="#14110A" />
          </TouchableOpacity>
          <Text className="font-figtree-bold text-2xl text-black-main">{t('services.title')}</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : services.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Plus size={32} color={colors.primary} />
          </View>
          <Text className="font-figtree-bold text-xl text-black-main mb-2">{t('services.noServices')}</Text>
          <Text className="font-figtree-regular text-sm text-gray-dark text-center">
            {t('services.noServicesHint')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          renderItem={renderServiceCard}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={openAddModal}
        className="absolute bottom-14 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/30"
      >
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-background rounded-t-[32px] p-4 shadow-2xl mt-24" style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}>
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-3" />
            
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-figtree-bold text-2xl text-black-main">
                {editingService ? t('services.editService') : t('services.addService')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 bg-gray-lighter rounded-full items-center justify-center">
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <TouchableOpacity onPress={pickImage} className="items-center mb-5">
                <View className="w-24 h-24 bg-white rounded-3xl border border-gray-lighter items-center justify-center overflow-hidden shadow-sm shadow-black/5">
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} className="w-full h-full" />
                  ) : editingService?.image ? (
                    <Image source={{ uri: editingService.image }} className="w-full h-full" />
                  ) : (
                    <ImageIcon size={32} color={colors.gray.light} />
                  )}
                </View>
                <Text className="font-figtree-medium text-xs text-primary mt-2">{t('services.changeImage')}</Text>
              </TouchableOpacity>

              {/* Form Fields */}
              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('services.serviceName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('services.serviceNamePlaceholder')}
                  className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>

              <View className="mb-3 flex-row gap-3">
                <View className="flex-1">
                  <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('services.price')} ({currencySymbol})</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                    placeholderTextColor={colors.gray.medium}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('services.duration')}</Text>
                  <TextInput
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholder={t('services.durationPlaceholder')}
                    className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                    placeholderTextColor={colors.gray.medium}
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('services.bufferTime')}</Text>
                <TextInput
                  value={bufferTime}
                  onChangeText={setBufferTime}
                  keyboardType="numeric"
                  placeholder={t('services.bufferPlaceholder')}
                  className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>

              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('services.category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {shopCategories.length === 0 ? (
                    <Text className="font-figtree-medium text-sm text-gray-medium">{t('services.noCategories')}</Text>
                  ) : (
                    shopCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat._id}
                        onPress={() => setCategoryId(cat._id)}
                        className={`px-4 py-2 rounded-full mr-2 border ${
                          categoryId === cat._id 
                            ? 'bg-primary border-primary' 
                            : 'bg-white border-gray-lighter'
                        }`}
                      >
                        <Text className={`font-figtree-medium text-sm ${
                          categoryId === cat._id ? 'text-white' : 'text-gray-dark'
                        }`}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('services.description')}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('services.descriptionPlaceholder')}
                  multiline
                  textAlignVertical="top"
                  className="bg-white border border-gray-lighter h-[100px] rounded-2xl px-4 py-3 font-figtree-regular text-base text-black-main"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={actionLoading}
                className="w-full bg-primary gap-2 h-[44px] rounded-2xl items-center justify-center flex-row shadow-sm shadow-primary/30"
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <CheckCircle2 size={20} color={colors.white} className="mr-2" />
                    <Text className="font-figtree-bold text-white text-lg">{t('services.saveService')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDelete}
        title={t('services.deleteTitle')}
        message={t('services.deleteMessage').replace('{name}', serviceToDelete?.name || '')}
        confirmText={t('common.delete')}
        type="danger"
      />
    </View>
  );
};

export default ManageServicesScreen;
