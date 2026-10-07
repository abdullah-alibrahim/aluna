import React, { useCallback, useEffect, useState } from 'react';
import { View, I18nManager, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Provider } from 'react-redux';
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
import { setLocale } from '@/i18n';

setLocale('ar');
I18nManager.allowRTL(true);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    const boot = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // native splash may already be hidden
      }
      setAppReady(true);
    };
    boot();
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(() => {}, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!appReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <KeyboardProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <View className="flex-1" style={{ direction: 'rtl' as any }} pointerEvents="box-none">
                <AppNavigator />
                <StatusBar style="dark" />
              </View>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </KeyboardProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
