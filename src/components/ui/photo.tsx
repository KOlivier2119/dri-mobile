import { Image, type ImageProps } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** A cover-fit photo that fades in once decoded. Decorative unless labelled. */
export function Photo({ style, ...props }: ImageProps) {
  return (
    <Image
      contentFit="cover"
      transition={260}
      accessible={Boolean(props.accessibilityLabel)}
      style={[StyleSheet.absoluteFill, style]}
      {...props}
    />
  );
}

/**
 * Vertical gradient laid over a photo so text on it stays readable.
 * `stops` are [offset 0–1, opacity 0–1] pairs from top to bottom.
 */
export function Scrim({
  color = Colors.night,
  stops = [
    [0, 0.35],
    [0.35, 0],
    [0.55, 0.15],
    [1, 0.92],
  ],
  style,
}: {
  color?: string;
  stops?: [number, number][];
  style?: StyleProp<ViewStyle>;
}) {
  // ids are document-global on web; a per-instance one keeps scrims independent
  const id = `scrim-${stops.map((s) => s.join('-')).join('_')}-${color.replace(/\W/g, '')}`;
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {stops.map(([offset, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Slow push-in on a background photo (a gentle Ken Burns), looping back and forth. */
export function Drift({
  children,
  scale = 1.08,
  duration = 14000,
  style,
}: {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t, duration]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: 1 + (scale - 1) * t.value }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, animated, style]}>{children}</Animated.View>;
}
