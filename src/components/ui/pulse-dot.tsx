import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

/** A "live" dot with a ring that keeps expanding and fading out. */
export function PulseDot({ size = 8, color = Colors.primaryBright, active = true }: { size?: number; color?: string; active?: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = active ? withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false) : 0;
  }, [t, active]);
  const ring = useAnimatedStyle(() => ({
    opacity: active ? 0.55 * (1 - t.value) : 0,
    transform: [{ scale: 1 + t.value * 1.6 }],
  }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: color }, ring]} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: active ? color : Colors.borderStrong }]} />
    </View>
  );
}
