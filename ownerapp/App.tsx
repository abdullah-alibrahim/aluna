import React, { useCallback, useEffect, useState } from 'react';
import { View, I18nManager, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Provider } from 'react-redux';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { store } from '@/store';
import { 
  useFonts, 
  Figtree_400Regular, 
  Figtree_500Medium, 
  Figtree_600SemiBold, 
  Figtree_700Bold 
} from '@expo-google-fonts/figtree';
import "./global.css";
import AppNavigator from '@/navigation/AppNavigator';
import BrandSplash from '@/components/common/BrandSplash';
import { setLocale } from '@/i18n';

setLocale('ar');
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

const MIN_SPLASH_MS = 2200;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const [appReady, setAppReady] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const started = Date.now();

    const boot = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {}
      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
      setTimeout(() => setAppReady(true), wait);
    };

    boot();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!appReady) return;
    splashOpacity.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setSplashGone)(true);
    });
  }, [appReady]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <View className="flex-1" style={{ direction: 'rtl' as any }}>
                <AppNavigator />
                <StatusBar style="dark" />
                {!splashGone ? (
                  <Animated.View style={[StyleSheet.absoluteFillObject, splashStyle, { zIndex: 99 }]} pointerEvents="none">
                    <BrandSplash subtitle="ألونا للمالكين" showLoader={!appReady} />
                  </Animated.View>
                ) : null}
              </View>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </KeyboardProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
