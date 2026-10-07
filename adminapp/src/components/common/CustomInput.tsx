import React from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';

export interface CustomInputProps extends TextInputProps {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  icon,
  rightIcon,
  onRightIconPress,
  containerClassName = '',
  ...props
}) => {
  return (
    <View 
      className={`flex-row items-center bg-[#251A15] rounded-[24px] px-5 h-[52px] border border-[#4A3E31]/30 ${containerClassName}`}
    >
      {icon && <View>{icon}</View>}
      
      <TextInput
        className={`flex-1 text-white font-figtree text-base h-full ${icon ? 'ml-3' : ''}`}
        placeholderTextColor="#706256"
        {...props}
      />
      
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} className="p-2 -mr-2">
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomInput;
