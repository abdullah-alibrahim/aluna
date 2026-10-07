import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { CreditCard, Nfc } from 'lucide-react-native';
import { formatMoney } from '@/utils/helper';

interface WalletCardProps {
  balance: number;
  ownerName: string;
  currency: string;
}

const WalletCard: React.FC<WalletCardProps> = ({ balance, ownerName, currency }) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      // Optional scale effect
    })
    .onUpdate((e) => {
      rotateX.value = -e.translationY / 10;
      rotateY.value = e.translationX / 10;
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ] as any,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <LinearGradient
          colors={['#1a1a1a', '#434343']} // Sleek dark metallic colors
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Top Section */}
          <View style={styles.topRow}>
            <View style={styles.chip}>
              <CreditCard size={24} color="#FFD700" strokeWidth={1.5} />
            </View>
            <Nfc size={24} color="#FFFFFF" strokeWidth={1.5} />
          </View>

          {/* Middle Section - Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>الرصيد المتاح</Text>
            <Text style={styles.balanceAmount}>{formatMoney(balance, currency || 'ل.س')}</Text>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.cardHolderLabel}>حامل البطاقة</Text>
              <Text style={styles.cardHolderName}>{ownerName.toUpperCase()}</Text>
            </View>
            
            {/* Fake Mastercard Logo */}
            <View style={styles.mastercardLogo}>
              <View style={[styles.circle, { backgroundColor: '#EB001B', right: -10 }]} />
              <View style={[styles.circle, { backgroundColor: '#F79E1B', opacity: 0.8 }]} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 22,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: '#333',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  balanceSection: {
    marginTop: 10,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Figtree-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFF',
    fontFamily: 'Figtree-Bold',
    fontSize: 36,
    letterSpacing: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolderLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Figtree-Medium',
    fontSize: 10,
    marginBottom: 4,
  },
  cardHolderName: {
    color: '#FFF',
    fontFamily: 'Figtree-Medium',
    fontSize: 16,
    letterSpacing: 2,
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default WalletCard;
