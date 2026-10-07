import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = 8, style, className }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB', // gray-200
          opacity,
        },
        style,
      ]}
      className={className}
    />
  );
};

export default Skeleton;
