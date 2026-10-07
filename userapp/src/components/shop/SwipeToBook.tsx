import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { scheduleOnRN } from 'react-native-worklets';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width - 40; // 20px padding on each side
const TRACK_HEIGHT = 56;
const SLIDER_WIDTH = 46;
const PADDING = 5;
const MAX_TRANSLATE = BUTTON_WIDTH - SLIDER_WIDTH - (PADDING * 2);

interface SwipeToBookProps {
  onBook: () => void;
  price?: string | number;
}

export default function SwipeToBook({ onBook, price }: SwipeToBookProps) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, MAX_TRANSLATE));
    })
    .onEnd(() => {
      if (translateX.value > MAX_TRANSLATE * 0.75) {
        translateX.value = withSpring(MAX_TRANSLATE, { damping: 15, stiffness: 90 });
        if (onBook) {
          scheduleOnRN(onBook); 
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - (translateX.value / MAX_TRANSLATE) * 1.5,
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      translateX.value,
      [0, MAX_TRANSLATE],
      ['#14110A', '#10B981'] // Changes to success green on full swipe
    );
    return {
      backgroundColor: bgColor,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, animatedBackgroundStyle]}>

        {/* Swipe Text - Now strictly absolutely positioned inside */}
        <Animated.View style={[styles.textContainer, animatedTextStyle]} pointerEvents="none">
          <Text style={styles.swipeText}>اسحبي للحجز</Text>
        </Animated.View>

        {/* Draggable Slider - Now strictly pinned absolute left */}
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.slider, animatedSliderStyle]}>
            <ChevronRight color="#14110A" size={24} strokeWidth={3} />
            <ChevronRight color="#14110A" size={24} strokeWidth={3} style={{ marginLeft: -12, opacity: 0.5 }} />
          </Animated.View>
        </GestureDetector>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_WIDTH,
    alignSelf: 'center',
    marginVertical: 10, // Gives a little breathing room from the bottom edge
  },
  background: {
    width: BUTTON_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2, // Perfect pill shape (28)
    position: 'relative', // CRITICAL: Forces absolute children to stay inside this track
    justifyContent: 'center', // Centers elements vertically
  },
  textContainer: {
    position: 'absolute', // Prevents text from pushing the black track up
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeText: {
    fontFamily: 'figtree-bold', // Uses your custom font natively
    fontWeight: 'bold', // Fallback if font isn't loaded
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 2, // Replaces tracking-widest
  },
  slider: {
    position: 'absolute', // Prevents the white button from pushing the track down
    left: PADDING, // Pins it exactly 5px from the left edge
    width: SLIDER_WIDTH,
    height: SLIDER_WIDTH,
    borderRadius: SLIDER_WIDTH / 2,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    zIndex: 10,

    // Optional: Adds a nice depth shadow to the button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  }
});