import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';

const CREAM = '#F9F5EB';
const GOLD = '#B59451';

type Props = {
  subtitle?: string;
  showLoader?: boolean;
};

/** Simple splash — no Reanimated (avoids white-screen crashes on boot). */
const BrandSplash: React.FC<Props> = ({
  subtitle = 'الجمال بلمسة هادئة',
  showLoader = true,
}) => {
  return (
    <View style={styles.root}>
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>{subtitle}</Text>
      {showLoader ? <ActivityIndicator color={GOLD} style={{ marginTop: 28 }} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    width: 200,
    height: 200,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: '#8A7A5C',
    textAlign: 'center',
  },
});

export default BrandSplash;
