import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { Wordmark } from '@/components/brand/mark';

const { width, height } = Dimensions.get('window');

/**
 * In-app brand intro layered over the native splash so the handoff is seamless:
 * native splash (ink + mark) → this overlay continues the motion, then fades away.
 */
export function SplashOverlay({ ready }: { ready: boolean }) {
  const reduced = useReducedMotion();
  const markIn = useSharedValue(0);
  const wordIn = useSharedValue(0);
  const exit = useSharedValue(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    markIn.value = withDelay(120, withTiming(1, { duration: reduced ? 1 : 620, easing: Easing.out(Easing.cubic) }));
    wordIn.value = withDelay(reduced ? 160 : 520, withTiming(1, { duration: reduced ? 1 : 480, easing: Easing.out(Easing.cubic) }));
  }, [markIn, wordIn, reduced]);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    void SplashScreen.hideAsync();
    exit.value = withDelay(
      reduced ? 250 : 950,
      withSequence(
        withTiming(1, { duration: reduced ? 120 : 420, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 0 }),
      ),
    );
    const timer = setTimeout(() => setDone(true), reduced ? 500 : 1500);
    return () => clearTimeout(timer);
  }, [ready, exit, reduced]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markIn.value,
    transform: [{ scale: 0.86 + 0.14 * markIn.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordIn.value }));
  const exitStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));

  if (done) return null;

  const markSize = Math.min(width, height) * 0.24;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1000 }, exitStyle]} pointerEvents="none">
      <View style={styles.background}>
        <View style={styles.center}>
          <Animated.View style={markStyle}>
            <Image
              source={require('@/assets/images/dri-mark.png')}
              style={{ width: markSize, height: markSize }}
              contentFit="contain"
              accessibilityLabel="DRI route mark"
            />
          </Animated.View>
          <Animated.View style={[styles.wordRow, wordStyle]}>
            <View style={styles.rule} />
            <Wordmark size={22} />
            <View style={styles.rule} />
          </Animated.View>
        </View>
        <RoutePulse reduced={!!reduced} />
      </View>
    </Animated.View>
  );
}

/** A mint dot travelling a route line beneath the mark — restrained motion. */
function RoutePulse({ reduced }: { reduced: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(
      700,
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
    );
  }, [t, reduced]);
  const style = useAnimatedStyle(
    () => ({
      left: `${4 + t.value * 88}%`,
      opacity: reduced ? 0 : 1 - Math.abs(t.value - 0.5) * 0.9,
    }),
    [t, reduced],
  );
  return (
    <View style={styles.pulseWrap} accessibilityElementsHidden>
      <View style={styles.pulseTrack} />
      <Animated.View style={[styles.pulse, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 28,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rule: {
    width: 34,
    height: 1,
    backgroundColor: Colors.inkBorder,
  },
  pulseWrap: {
    position: 'absolute',
    bottom: height * 0.18,
    left: 0,
    right: 0,
    height: 2,
  },
  pulseTrack: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: Colors.inkBorder,
  },
  pulse: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.mint,
    top: -2,
  },
});
