import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTicket } from '@/store/slices/ticketSlice';
import twConfig from '../../tailwind.config.js';
import { t } from '@/i18n';

const colors = twConfig.theme.extend.colors;

const CreateTicketScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { actionLoading } = useAppSelector(state => state.tickets);

  const [subject, setSubject] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!subject.trim() || !reason.trim()) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');

    try {
      await dispatch(createTicket({ subject, reason })).unwrap();
      navigation.goBack();
    } catch (err: any) {
      setError(err || t('tickets.sendFailed'));
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View 
        className="px-3 flex-row items-center justify-between bg-background z-10"
        style={{ paddingTop: insets.top, paddingBottom: 16 }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-background border border-gray-lighter"
        >
          <ChevronLeft size={20} color="#14110A" />
        </TouchableOpacity>
        <Text className="text-black-main font-figtree-bold text-lg">{t('tickets.newMessage')}</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 p-4">
        <Text className="font-figtree-bold text-2xl text-black-main mb-2">{t('tickets.howCanWeHelp')}</Text>
        <Text className="font-figtree-medium text-gray-medium mb-3">{t('tickets.supportHint')}</Text>

        {error ? (
          <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
            <Text className="text-red-500 font-figtree-medium text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <View className="mb-3">
          <Text className="font-figtree-bold text-black-main text-sm mb-2">{t('tickets.subject')}</Text>
          <View className="bg-white rounded-2xl border border-gray-lighter px-3 py-2">
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder={t('tickets.subjectPlaceholder')}
              placeholderTextColor="#9CA3AF"
              className="font-figtree-medium text-black-main text-base"
              maxLength={100}
            />
          </View>
        </View>

        <View className="mb-3 flex-1">
          <Text className="font-figtree-bold text-black-main text-sm mb-2">{t('tickets.message')}</Text>
          <View className="bg-white rounded-2xl border border-gray-lighter px-4 py-3 flex-1">
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={t('tickets.messagePlaceholder')}
              placeholderTextColor="#9CA3AF"
              className="font-figtree-medium text-black-main text-base"
              multiline
              textAlignVertical="top"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={actionLoading || !subject.trim() || !reason.trim()}
          className={`flex-row items-center justify-center py-3 rounded-full ${(!subject.trim() || !reason.trim() || actionLoading) ? 'bg-primary/50' : 'bg-primary'}`}
          style={{ marginBottom: Math.max(insets.bottom, 20) }}
        >
          {actionLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Send size={20} color="white" />
              <Text className="font-figtree-bold text-white text-lg ml-2">{t('tickets.sendMessage')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateTicketScreen;
