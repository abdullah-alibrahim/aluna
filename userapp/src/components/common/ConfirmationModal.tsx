import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { t } from '@/i18n';

const ConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = t('common.confirm'), 
  cancelText = t('common.cancel'),
  type = 'danger' // 'danger' or 'primary'
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View className="bg-white w-[85%] rounded-[32px] p-5 shadow-2xl">
              {/* Icon / Warning */}
              <View className={`w-14 h-14 rounded-full ${type === 'danger' ? 'bg-rose-50' : 'bg-primary/10'} items-center justify-center mb-3`}>
                <AlertCircle size={28} color={type === 'danger' ? '#F43F5E' : '#050505'} />
              </View>

              <Text className="font-figtree-bold text-xl text-black-main mb-2">
                {title}
              </Text>
              
              <Text className="font-figtree text-gray-dark opacity-60 text-base leading-relaxed mb-3">
                {message}
              </Text>

              <View className="flex-row gap-x-3">
                <TouchableOpacity 
                  onPress={onClose}
                  className="flex-1 bg-gray-lighter h-[44px] rounded-2xl items-center justify-center"
                >
                  <Text className="font-figtree-bold text-black-main">{cancelText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={onConfirm}
                  className={`flex-1 ${type === 'danger' ? 'bg-rose-500' : 'bg-black-main'} h-[44px] rounded-2xl items-center justify-center`}
                >
                  <Text className="font-figtree-bold text-white">{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 5, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConfirmationModal;
