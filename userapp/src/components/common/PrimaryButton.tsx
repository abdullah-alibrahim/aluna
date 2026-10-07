import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

export interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <TouchableOpacity 
      disabled={isDisabled}
      className={`h-[50px] rounded-[24px] items-center justify-center shadow-lg shadow-primary/40 ${
        isDisabled ? 'bg-primary/50' : 'bg-primary'
      } ${className}`}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#14110A" />
      ) : (
        <Text className="text-[#14110A] text-lg font-figtree-bold">{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
