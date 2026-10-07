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
  User,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStaff, addStaff, updateStaff, deleteStaff, StaffMember } from '@/store/slices/staffSlice';
import { fetchServices } from '@/store/slices/serviceSlice';
import { Shop } from '@/store/slices/shopSlice';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import apiClient from '@/api/client';
import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const ManageStaffScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { shop } = route.params as { shop: Shop };
  const dispatch = useAppDispatch();

  const { staffList, loading, actionLoading } = useAppSelector((state) => state.staff);
  const { services } = useAppSelector((state) => state.services);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [branches, setBranches] = useState<{ _id: string; name: string; isMain?: boolean }[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // New Global Break State
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');

  // Delete Confirmation State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  useEffect(() => {
    dispatch(fetchStaff(shop._id));
    if (services.length === 0) {
      dispatch(fetchServices(shop._id));
    }
    apiClient
      .get(`/owner/shops/${shop._id}/branches`)
      .then((res) => setBranches((res.data || []).filter((b: any) => b.isActive !== false)))
      .catch(() => setBranches([]));
  }, [dispatch, shop._id]);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setRole('');
    setSelectedBranchId(branches.find((b) => b.isMain)?._id || branches[0]?._id || '');
    setSelectedServiceIds([]);
    setImageUri(null);
    setBreakStart('');
    setBreakEnd('');
    setModalVisible(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setRole(staff.role);
    const bid = typeof staff.branchId === 'object' && staff.branchId ? staff.branchId._id : staff.branchId || '';
    setSelectedBranchId(bid);
    setSelectedServiceIds((staff.servicesProvided || []).map(s => typeof s === 'string' ? s : s._id));
    setImageUri(null);
    
    // Attempt to parse global break from first working day
    if (staff.workingHours && staff.workingHours.length > 0 && staff.workingHours[0].breaks && staff.workingHours[0].breaks.length > 0) {
      setBreakStart(staff.workingHours[0].breaks[0].start);
      setBreakEnd(staff.workingHours[0].breaks[0].end);
    } else {
      setBreakStart('');
      setBreakEnd('');
    }
    
    setModalVisible(true);
  };

  const toggleServiceSelection = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter(serviceId => serviceId !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const confirmDelete = (staff: StaffMember) => {
    setStaffToDelete(staff);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await dispatch(deleteStaff({ shopId: shop._id, staffId: staffToDelete._id })).unwrap();
      setDeleteModalVisible(false);
      setStaffToDelete(null);
    } catch (err: any) {
      Alert.alert(t('common.error'), typeof err === 'string' ? err : err?.message || JSON.stringify(err) || t('common.genericError'));
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !role) {
      Alert.alert(t('common.validationError'), t('staff.nameRoleRequired'));
      return;
    }

    const formData = new FormData() as any;
    formData.append('name', name);
    formData.append('role', role);
    formData.append('servicesProvided', JSON.stringify(selectedServiceIds));
    formData.append('branchId', selectedBranchId || '');

    if (breakStart && breakEnd) {
      formData.append('globalBreakStart', breakStart);
      formData.append('globalBreakEnd', breakEnd);
    }

    if (imageUri) {
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
    }

    try {
      if (editingStaff) {
        await dispatch(updateStaff({ shopId: shop._id, staffId: editingStaff._id, formData })).unwrap();
      } else {
        await dispatch(addStaff({ shopId: shop._id, formData })).unwrap();
      }
      setModalVisible(false);
      dispatch(fetchStaff(shop._id));
    } catch (err: any) {
      Alert.alert(t('common.error'), typeof err === 'string' ? err : err?.message || JSON.stringify(err) || t('common.genericError'));
    }
  };

  const renderStaffCard = ({ item }: { item: StaffMember }) => {
    const servicesCount = item.servicesProvided?.length || 0;
    const branchName =
      typeof item.branchId === 'object' && item.branchId
        ? item.branchId.name
        : branches.find((b) => b._id === item.branchId)?.name;

    return (
      <View className="bg-white p-4 rounded-3xl mb-4 border border-gray-lighter shadow-sm shadow-black/5 flex-row items-center gap-4">
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} className="w-16 h-16 rounded-full bg-gray-100" />
        ) : (
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
            <User size={24} color={colors.primary} />
          </View>
        )}

        <View className="flex-1">
          <Text className="font-figtree-bold text-base text-black-main mb-0.5" numberOfLines={1}>{item.name}</Text>
          <Text className="font-figtree-medium text-sm text-gray-dark mb-1.5">{item.role}</Text>
          {branchName ? (
            <Text className="font-figtree-medium text-xs text-gray-medium mb-1.5">{branchName}</Text>
          ) : null}
          
          <View className="bg-primary/10 self-start px-2 py-1 rounded-md">
            <Text className="font-figtree-semibold text-[10px] text-primary">
              {servicesCount} {servicesCount === 1 ? t('staff.serviceAssigned') : t('staff.servicesAssigned')}
            </Text>
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
      <View className="px-3 flex-row items-center justify-between mb-3 mt-2">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 border border-gray-lighter shadow-sm shadow-black/5"
          >
            <ArrowLeft size={20} color="#14110A" />
          </TouchableOpacity>
          <Text className="font-figtree-bold text-2xl text-black-main">{t('staff.title')}</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : staffList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-3">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <User size={32} color={colors.primary} />
          </View>
          <Text className="font-figtree-bold text-xl text-black-main mb-2">{t('staff.noStaff')}</Text>
          <Text className="font-figtree-regular text-sm text-gray-dark text-center">
            {t('staff.noStaffHint')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={staffList}
          keyExtractor={(item) => item._id}
          renderItem={renderStaffCard}
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
                {editingStaff ? t('staff.editStaff') : t('staff.addStaff')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 bg-gray-lighter rounded-full items-center justify-center">
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <TouchableOpacity onPress={pickImage} className="items-center mb-3">
                <View className="w-24 h-24 bg-white rounded-full border border-gray-lighter items-center justify-center overflow-hidden shadow-sm shadow-black/5">
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} className="w-full h-full" />
                  ) : editingStaff?.avatar ? (
                    <Image source={{ uri: editingStaff.avatar }} className="w-full h-full" />
                  ) : (
                    <User size={32} color={colors.gray.light} />
                  )}
                </View>
                <Text className="font-figtree-medium text-xs text-primary mt-2">{t('staff.changeAvatar')}</Text>
              </TouchableOpacity>

              {/* Form Fields */}
              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('staff.fullName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('staff.fullNamePlaceholder')}
                  className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>

              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('staff.role')}</Text>
                <TextInput
                  value={role}
                  onChangeText={setRole}
                  placeholder={t('staff.rolePlaceholder')}
                  className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>

              {branches.length > 0 && (
                <View className="mb-3">
                  <Text className="font-figtree-medium text-sm text-black-main mb-2">الفرع</Text>
                  <View className="flex-row flex-wrap">
                    {branches.map((b) => (
                      <TouchableOpacity
                        key={b._id}
                        onPress={() => setSelectedBranchId(b._id)}
                        className={`px-3 py-2 rounded-xl mr-2 mb-2 border ${
                          selectedBranchId === b._id
                            ? 'bg-primary border-primary'
                            : 'bg-white border-gray-lighter'
                        }`}
                      >
                        <Text
                          className={`font-figtree-medium text-xs ${
                            selectedBranchId === b._id ? 'text-white' : 'text-gray-dark'
                          }`}
                        >
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View className="mb-3 flex-row gap-3">
                <View className="flex-1">
                  <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('staff.lunchBreakStart')}</Text>
                  <TextInput
                    value={breakStart}
                    onChangeText={setBreakStart}
                    placeholder="12:00"
                    className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                    placeholderTextColor={colors.gray.medium}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('staff.lunchBreakEnd')}</Text>
                  <TextInput
                    value={breakEnd}
                    onChangeText={setBreakEnd}
                    placeholder="13:00"
                    className="bg-white border border-gray-lighter h-[50px] rounded-2xl px-4 font-figtree-regular text-base text-black-main"
                    placeholderTextColor={colors.gray.medium}
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="font-figtree-medium text-sm text-black-main mb-2">{t('staff.servicesProvided')}</Text>
                {services.length === 0 ? (
                  <Text className="font-figtree-medium text-sm text-gray-medium">{t('staff.addServicesFirst')}</Text>
                ) : (
                  <View className="flex-row flex-wrap">
                    {services.map((srv) => (
                      <TouchableOpacity
                        key={srv._id}
                        onPress={() => toggleServiceSelection(srv._id)}
                        className={`px-3 py-2 rounded-xl mr-2 mb-2 border ${
                          selectedServiceIds.includes(srv._id)
                            ? 'bg-primary border-primary' 
                            : 'bg-white border-gray-lighter'
                        }`}
                      >
                        <Text className={`font-figtree-medium text-xs ${
                          selectedServiceIds.includes(srv._id) ? 'text-white' : 'text-gray-dark'
                        }`}>
                          {srv.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={actionLoading}
                className="w-full bg-primary gap-2 h-[44px] rounded-2xl items-center justify-center flex-row shadow-sm shadow-primary/30 mb-5"
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <CheckCircle2 size={20} color={colors.white} />
                    <Text className="font-figtree-bold text-white text-lg">{t('staff.saveStaff')}</Text>
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
          setStaffToDelete(null);
        }}
        onConfirm={handleDelete}
        title={t('staff.deleteTitle')}
        message={t('staff.deleteMessage').replace('{name}', staffToDelete?.name || '')}
        confirmText={t('common.remove')}
        type="danger"
      />
    </View>
  );
};

export default ManageStaffScreen;
