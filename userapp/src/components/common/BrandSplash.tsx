import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const GOLD = '#B59451';
const CREAM = '#F9F5EB';

type BrandSplashProps = {
  subtitle?: string;
  showLoader?: boolean;
};

/**
 * Aluna branded animated splash — cream + gold aura, logo entrance.
 * Logo asset already includes Aluna / ألونا wordmark.
 */
const BrandSplash: React.FC<BrandSplashProps> = ({
  subtitle = 'الجمال بلمسة هادئة',
  showLoader = true,
}) => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const logoY = useSharedValue(18);
  const glow = useSharedValue(0.28);
  const ring = useSharedValue(0.92);
  const lineWidth = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const subOpacity = useSharedValue(0);
  const subY = useSharedValue(10);
  const loader = useSharedValue(0.2);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 15, stiffness: 110 });
    logoY.value = withSpring(0, { damping: 16, stiffness: 120 });

    glow.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.22, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    ring.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.94, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    lineWidth.value = withDelay(500, withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }));
    heartOpacity.value = withDelay(780, withSpring(1, { damping: 12, stiffness: 160 }));

    subOpacity.value = withDelay(700, withTiming(1, { duration: 550 }));
    subY.value = withDelay(700, withSpring(0, { damping: 16, stiffness: 140 }));

    loader.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    shimmer.value = withDelay(
      400,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: ring.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: interpolate(lineWidth.value, [0, 1], [0, Math.min(120, width * 0.28)]),
    opacity: interpolate(lineWidth.value, [0, 0.15, 1], [0, 1, 1]),
  }));

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: interpolate(heartOpacity.value, [0, 1], [0.6, 1]) }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loader.value,
    transform: [{ scaleX: interpolate(shimmer.value, [0, 1], [0.45, 1]) }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.wash} pointerEvents="none" />
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Animated.Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.dividerRow}>
          <Animated.View style={[styles.line, lineStyle]} />
          <Animated.Text style={[styles.heart, heartStyle]}>♥</Animated.Text>
          <Animated.View style={[styles.line, lineStyle]} />
        </View>

        <Animated.Text style={[styles.subtitle, subStyle]}>{subtitle}</Animated.Text>

        {showLoader ? (
          <View style={styles.loaderTrack}>
            <Animated.View style={[styles.loaderFill, loaderStyle]} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FBF6EC',
    opacity: 0.65,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(181, 148, 81, 0.16)',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: {
    marginBottom: 4,
  },
  logo: {
    width: Math.min(280, width * 0.72),
    height: Math.min(280, width * 0.72),
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    height: 18,
  },
  line: {
    height: 1.5,
    backgroundColor: GOLD,
    borderRadius: 1,
  },
  heart: {
    color: GOLD,
    fontSize: 11,
    marginHorizontal: 10,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#8A7A5C',
    fontFamily: 'Figtree_500Medium',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loaderTrack: {
    marginTop: 40,
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(181, 148, 81, 0.18)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderFill: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
    backgroundColor: GOLD,
  },
});

export default BrandSplash;
