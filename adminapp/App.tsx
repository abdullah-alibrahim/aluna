import React, { Component, useEffect, useState, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Provider } from 'react-redux';
import { store } from '@/store';
import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import './global.css';
import AppNavigator from '@/navigation/AppNavigator';
import { setLocale } from '@/i18n';

setLocale('ar');

SplashScreen.preventAutoHideAsync().catch(() => {});

const CREAM = '#F9F5EB';
const GOLD = '#B59451';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.boot}>
          <Text style={styles.bootTitle}>تعذّر تشغيل التطبيق</Text>
          <Text style={styles.bootError}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function BootSplash({ label }: { label: string }) {
  return (
    <View style={styles.boot}>
      <Image
        source={require('./assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.bootTitle}>ألونا</Text>
      <Text style={styles.bootSub}>{label}</Text>
      <ActivityIndicator color={GOLD} style={{ marginTop: 28 }} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {}
      // Short branded pause then show app (no Reanimated / no forceRTL)
      await new Promise((r) => setTimeout(r, 900));
      if (!cancelled) setReady(true);
    };
    if (fontsLoaded || fontError) boot();
    // Safety: never stay blank if fonts hang
    const failSafe = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, [fontsLoaded, fontError]);

  if (!ready && !fontsLoaded && !fontError) {
    return <BootSplash label="جاري التحميل…" />;
  }

  if (!ready) {
    return <BootSplash label="ألونا للإدارة" />;
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: CREAM }}>
          <SafeAreaProvider>
            <KeyboardProvider>
              <View style={{ flex: 1, backgroundColor: CREAM, direction: 'rtl' as any }}>
                <AppNavigator />
                <StatusBar style="dark" />
              </View>
            </KeyboardProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  bootTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1A17',
    textAlign: 'center',
  },
  bootSub: {
    marginTop: 8,
    fontSize: 15,
    color: '#8A7A5C',
    textAlign: 'center',
  },
  bootError: {
    marginTop: 12,
    fontSize: 13,
    color: '#B42318',
    textAlign: 'center',
  },
});
