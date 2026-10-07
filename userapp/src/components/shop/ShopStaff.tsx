import React from 'react';
import { View, Text, Image } from 'react-native';

export default function ShopStaff({ staff }: { staff: any[] }) {
  if (!staff || staff.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-light font-figtree">لا متخصصات متاحات حالياً</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap justify-between pb-10">
      {staff.map((member, index) => (
        <View 
          key={member._id || index}
          className="w-[48%] bg-white p-4 mb-2 items-center"
        >
          <Image 
            source={{ uri: member.avatar || 'https://i.pravatar.cc/150?u=' + member._id }} 
            className="w-20 h-20 rounded-full mb-3 bg-gray-100"
          />
          <Text className="text-black-main font-figtree-bold text-base text-center" numberOfLines={1}>
            {member.name}
          </Text>
          <Text className="text-primary font-figtree-medium text-xs text-center mt-1">
            {member.role || 'Specialist'}
          </Text>
        </View>
      ))}
    </View>
  );
}
