import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  delay?: number;
  style?: any;
};

/** Soft fade + rise entrance for screen sections */
export const FadeRise: React.FC<Props> = ({ children, delay = 0, style }) => {
  const opacity = useSharedValue(0);
  const y = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    y.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 140 }));
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
};

type ScaleInProps = {
  children: React.ReactNode;
  delay?: number;
  style?: any;
};

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0, style }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.center, animStyle, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
});
