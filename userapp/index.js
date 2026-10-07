import { StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';

// NativeWind / css-interop on web requires class-based dark mode
try {
  // @ts-expect-error RN web StyleSheet flag
  StyleSheet.setFlag?.('darkMode', 'class');
} catch {
  /* native */
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
