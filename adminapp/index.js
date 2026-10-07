import 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

// NativeWind / css-interop: avoid white-screen crash on web
try {
  // @ts-ignore
  StyleSheet.setFlag?.('darkMode', 'class');
} catch {}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
