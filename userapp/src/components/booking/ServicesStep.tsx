import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, Image } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { t } from '@/i18n';

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
}

interface ServicesStepProps {
  services: Service[];
  selectedServiceIds: string[];
  handleServiceToggle: (id: string) => void;
  currency: string;
}

export default function ServicesStep({
  services,
  selectedServiceIds,
  handleServiceToggle,
  currency,
}: ServicesStepProps) {
  return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 140 }}>
      {services.map(service => (
        <TouchableOpacity
          key={service._id}
          onPress={() => handleServiceToggle(service._id)}
          className={`bg-white p-4 rounded-3xl mb-3 flex-row items-center border ${
            selectedServiceIds.includes(service._id) ? 'border-primary' : 'border-gray-lighter'
          }`}
        >
          <View className="w-16 h-16 rounded-2xl bg-gray-50 mr-4 overflow-hidden items-center justify-center">
            {service.image ? (
              <Image source={{ uri: service.image }} className="w-full h-full" />
            ) : (
              <Text className="text-2xl text-gray-light">💅</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="font-figtree-bold text-base text-black-main mb-1">{service.name}</Text>
            <Text className="font-figtree-medium text-xs text-gray-dark">{service.duration} {t('common.minutes')}</Text>
          </View>
          <View className="items-end justify-center">
            <Text className="font-figtree-bold text-lg text-primary">{currency}{service.price}</Text>
            <View
              className={`w-6 h-6 rounded-full mt-2 items-center justify-center border ${
                selectedServiceIds.includes(service._id) ? 'bg-primary border-primary' : 'border-gray-lighter'
              }`}
            >
              {selectedServiceIds.includes(service._id) && <CheckCircle2 size={14} color="#FFF" />}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
