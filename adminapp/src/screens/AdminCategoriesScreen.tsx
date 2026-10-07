import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  X, 
  Check,
  Edit2,
  Grid
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, addCategory, updateCategory, clearCategoryError, Category } from '@/store/slices/categorySlice';
import { t } from '@/i18n';

const AdminCategoriesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { categories, loading, error, addLoading, addError } = useAppSelector((state) => state.categories);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (addError) {
      Alert.alert(t('common.error'), addError);
      dispatch(clearCategoryError());
    }
  }, [addError, dispatch]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('adminScreens.cameraRollPermission'));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.validationError'), t('adminScreens.categoryNameRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    
    if (image && !image.startsWith('http')) {
      // It's a new local image, append it
      const filename = image.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('image', {
        uri: image,
        name: filename,
        type,
      } as any);
    }

    if (editingCategory) {
      const resultAction = await dispatch(updateCategory({ id: editingCategory._id, formData }));
      if (updateCategory.fulfilled.match(resultAction)) {
        setModalVisible(false);
        resetForm();
      }
    } else {
      if (!image) {
        Alert.alert(t('common.validationError'), t('adminScreens.categoryImageRequired'));
        return;
      }
      const resultAction = await dispatch(addCategory(formData));
      if (addCategory.fulfilled.match(resultAction)) {
        setModalVisible(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setImage(null);
    setEditingCategory(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setImage(category.image || null);
    setModalVisible(true);
  };

  const renderCategory = ({ item }) => (
    <View className="w-[48%] mb-3 bg-white rounded-3xl border border-gray-lighter shadow-sm shadow-black/5 overflow-hidden">
      {item.image ? (
        <Image source={{ uri: item.image }} className="w-full h-32 bg-gray-lighter" resizeMode="cover" />
      ) : (
        <View className="w-full h-32 bg-gray-lighter items-center justify-center">
          <ImageIcon size={32} color="#D1D5DB" />
        </View>
      )}

      {/* Edit Button */}
      <TouchableOpacity 
        onPress={() => handleEditCategory(item)}
        className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full items-center justify-center shadow-sm"
      >
        <Edit2 size={16} color="#B59451" />
      </TouchableOpacity>

      <View className="p-4">
        <Text className="font-figtree-bold text-base text-black-main mb-1" numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text className="font-figtree-regular text-xs text-gray-medium" numberOfLines={2}>{item.description}</Text>
        ) : (
          <Text className="font-figtree-regular text-xs text-gray-medium italic">بدون وصف</Text>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-4 bg-background z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
        >
          <ArrowLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="font-figtree-bold text-xl text-black-main">التصنيفات</Text>
      </View>

      {/* Main Content */}
      {loading && categories.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B59451" />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={renderCategory}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm shadow-black/5 mb-4">
                <Grid size={32} color="#D1D5DB" />
              </View>
              <Text className="font-figtree-bold text-lg text-black-main mb-2">لا تصنيفات بعد</Text>
              <Text className="font-figtree-regular text-sm text-gray-medium text-center px-6">
                اضغطي + لإنشاء أول تصنيف خدمات.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleOpenAddModal}
        className="absolute bottom-18 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40"
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          {/* Modal Backdrop */}
          <TouchableOpacity 
            className="absolute inset-0 bg-black-main/40"
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          
          {/* Modal Content */}
          <View 
            className="bg-background rounded-t-[32px] p-4 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-3" />
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-figtree-bold text-2xl text-black-main">
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 bg-gray-lighter rounded-full items-center justify-center">
                <X size={18} color="#14110A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <TouchableOpacity 
                onPress={pickImage}
                className="w-full h-40 bg-white border-2 border-dashed border-primary/30 rounded-3xl items-center justify-center mb-3 overflow-hidden"
              >
                {image ? (
                  <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <>
                    <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-2">
                      <ImageIcon size={24} color="#B59451" />
                    </View>
                    <Text className="font-figtree-semibold text-primary">رفع صورة</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Form Fields */}
              <View className="mb-3">
                <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">اسم التصنيف *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="مثال: قصات، صبغ"
                  className="bg-white px-4 py-4 rounded-2xl border border-gray-lighter font-figtree-medium text-black-main text-base"
                  placeholderTextColor="#9C8C80"
                />
              </View>

              <View className="mb-3">
                <Text className="font-figtree-bold text-sm text-gray-dark mb-2 ml-1">الوصف</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="وصف مختصر لهذا التصنيف"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-white px-4 py-4 rounded-2xl border border-gray-lighter font-figtree-medium text-black-main text-base min-h-[100px]"
                  placeholderTextColor="#9C8C80"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={addLoading}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${addLoading ? 'bg-primary/50' : 'bg-primary shadow-lg shadow-primary/30'}`}
              >
                {addLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Check size={20} color="#FFF" className="mr-2" />
                    <Text className="font-figtree-bold text-white text-lg">
                      {editingCategory ? 'تحديث التصنيف' : 'حفظ التصنيف'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default AdminCategoriesScreen;
