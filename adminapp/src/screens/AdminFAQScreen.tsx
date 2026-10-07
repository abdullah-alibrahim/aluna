import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Trash2, 
  MessageCircleQuestion, 
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchFAQs, addFAQ, updateFAQ, toggleFAQStatus, deleteFAQ } from '@/store/slices/faqSlice';
import twConfig from '../../tailwind.config.js';
import dayjs from 'dayjs';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const AdminFAQScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { faqs, loading, actionLoading } = useAppSelector(state => state.faq);

  const [activeTab, setActiveTab] = useState<'user' | 'owner'>('user');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [target, setTarget] = useState<'user' | 'owner'>('user');
  
  // Accordion State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchFAQs());
  }, [dispatch]);

  const filteredFAQs = faqs.filter(f => f.target === activeTab);

  const openAddModal = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setTarget(activeTab);
    setModalVisible(true);
  };

  const openEditModal = (faq: any) => {
    setEditingId(faq._id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setTarget(faq.target);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert(t('common.error'), t('adminScreens.faqFieldsRequired'));
      return;
    }

    if (editingId) {
      await dispatch(updateFAQ({ id: editingId, data: { question, answer, target } }));
    } else {
      await dispatch(addFAQ({ question, answer, target }));
    }
    
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('adminScreens.deleteFaq'), t('adminScreens.deleteFaqConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => dispatch(deleteFAQ(id)) }
    ]);
  };

  const handleToggle = (id: string) => {
    dispatch(toggleFAQStatus(id));
  };

  const renderFAQCard = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item._id;

    return (
      <View className="bg-white rounded-3xl p-5 mb-4 border border-gray-lighter shadow-sm shadow-black/5">
        {/* Top Info */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${item.isActive ? 'bg-success' : 'bg-gray-medium'}`} />
            <Text className="font-figtree-semibold text-xs text-black-main">
              {item.isActive ? 'نشط' : 'غير نشط'}
            </Text>
          </View>
          <Text className="font-figtree-medium text-[10px] text-gray-medium">
            {dayjs(item.createdAt).format('D MMM YYYY')}
          </Text>
        </View>

        {/* Question Header (Toggleable) */}
        <TouchableOpacity 
          className="flex-row items-start justify-between"
          onPress={() => setExpandedId(isExpanded ? null : item._id)}
          activeOpacity={0.7}
        >
          <Text className="flex-1 font-figtree-bold text-base text-black-main pr-3">
            {item.question}
          </Text>
          <View className="w-8 h-8 rounded-full bg-background items-center justify-center">
            {isExpanded ? (
              <ChevronUp size={16} color={colors['black-main']} />
            ) : (
              <ChevronDown size={16} color={colors['black-main']} />
            )}
          </View>
        </TouchableOpacity>

        {/* Answer Content (Expanded) */}
        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-gray-lighter">
            <Text className="font-figtree text-sm text-gray-dark leading-relaxed">
              {item.answer}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-gray-lighter">
          <View className="flex-row items-center">
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggle(item._id)}
              trackColor={{ false: colors.gray.lighter, true: colors.success.DEFAULT + '40' }}
              thumbColor={item.isActive ? colors.success.DEFAULT : '#f4f3f4'}
              disabled={actionLoading}
              className="mr-2"
            />
            <Text className="font-figtree-medium text-xs text-gray-medium">تبديل الحالة</Text>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => openEditModal(item)}
              disabled={actionLoading}
              className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center mr-2"
            >
              <Edit3 size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDelete(item._id)}
              disabled={actionLoading}
              className="w-10 h-10 rounded-full bg-error/10 items-center justify-center"
            >
              <Trash2 size={18} color={colors.error.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-background z-10">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-lighter shadow-sm shadow-black/5 mr-3"
          >
            <ArrowLeft size={20} color={colors['black-main']} />
          </TouchableOpacity>
          <Text className="font-figtree-bold text-xl text-black-main">إدارة الأسئلة الشائعة</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 mb-2">
        <View className="flex-row bg-white p-1 rounded-full shadow-sm shadow-black/5 border border-gray-lighter">
          <TouchableOpacity 
            onPress={() => setActiveTab('user')}
            className={`flex-1 py-3 rounded-full items-center ${activeTab === 'user' ? 'bg-black-main' : 'bg-transparent'}`}
          >
            <Text className={`font-figtree-bold text-sm ${activeTab === 'user' ? 'text-white' : 'text-gray-medium'}`}>
              زبونة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('owner')}
            className={`flex-1 py-3 rounded-full items-center ${activeTab === 'owner' ? 'bg-black-main' : 'bg-transparent'}`}
          >
            <Text className={`font-figtree-bold text-sm ${activeTab === 'owner' ? 'text-white' : 'text-gray-medium'}`}>
              مالكة
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQ List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredFAQs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-6 shadow-sm shadow-black/5">
            <MessageCircleQuestion size={40} color={colors.gray.lighter} />
          </View>
          <Text className="font-figtree-bold text-xl text-black-main mb-2">لا أسئلة بعد</Text>
          <Text className="font-figtree text-base text-gray-medium text-center">
            لم تضيفي أي أسئلة شائعة بعد. اضغطي + لإضافة سؤال.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFAQs}
          keyExtractor={item => item._id}
          renderItem={renderFAQCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity 
        onPress={openAddModal}
        className="absolute right-6 bottom-14 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 z-50"
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-[32px] overflow-hidden" style={{ maxHeight: '90%' }}>
            {/* Modal Header */}
            <View className="flex-row justify-between items-center px-3 py-4 border-b border-gray-lighter bg-white">
              <Text className="font-figtree-bold text-lg text-black-main">
                {editingId ? 'تعديل سؤال' : 'إضافة سؤال'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 bg-background rounded-full items-center justify-center"
              >
                <X size={20} color={colors['black-main']} />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView 
              bottomOffset={20}
              contentContainerStyle={{ padding: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Target Selector */}
              <Text className="font-figtree-semibold text-sm text-black-main mb-2 ml-1">الجمهور المستهدف</Text>
              <View className="flex-row bg-white p-1 rounded-2xl border border-gray-lighter mb-3">
                <TouchableOpacity 
                  onPress={() => setTarget('user')}
                  className={`flex-1 py-3 rounded-xl items-center ${target === 'user' ? 'bg-primary/10' : 'bg-transparent'}`}
                >
                  <Text className={`font-figtree-bold text-sm ${target === 'user' ? 'text-primary' : 'text-gray-medium'}`}>
                    زبونة
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTarget('owner')}
                  className={`flex-1 py-3 rounded-xl items-center ${target === 'owner' ? 'bg-primary/10' : 'bg-transparent'}`}
                >
                  <Text className={`font-figtree-bold text-sm ${target === 'owner' ? 'text-primary' : 'text-gray-medium'}`}>
                    مالكة
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Question Input */}
              <Text className="font-figtree-semibold text-sm text-black-main mb-2 ml-1">السؤال</Text>
              <View className="bg-white rounded-2xl border border-gray-lighter px-3 py-3 mb-3">
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="اكتبي السؤال..."
                  placeholderTextColor={colors.gray.light}
                  className="font-figtree-medium text-sm text-black-main"
                  multiline
                />
              </View>

              {/* Answer Input */}
              <Text className="font-figtree-semibold text-sm text-black-main mb-2 ml-1">الجواب</Text>
              <View className="bg-white rounded-2xl border border-gray-lighter px-4 py-3 mb-8">
                <TextInput
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="اكتبي الجواب التفصيلي..."
                  placeholderTextColor={colors.gray.light}
                  className="font-figtree-medium text-sm text-black-main min-h-[120px]"
                  multiline
                  textAlignVertical="top"
                  style={{ paddingTop: 0, paddingBottom: 0 }}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={actionLoading}
                className="h-12 bg-black-main rounded-full flex-row items-center justify-center shadow-lg shadow-black/20"
                style={{ marginBottom: insets.bottom }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="font-figtree-bold text-base text-white">
                    {editingId ? 'تحديث السؤال' : 'إنشاء سؤال'}
                  </Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminFAQScreen;
