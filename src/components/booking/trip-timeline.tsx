import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { PulseDot } from '@/components/ui/pulse-dot';
import type { Booking } from '@/api/types';
import { BOOKING_STEPS, bookingStep } from '@/utils/booking';
import { useI18n } from '@/i18n';

/** Six-stop progress line; the fill springs forward as the trip advances. */
export function TripTimeline({ booking }: { booking: Booking }) {
  const { t } = useI18n();
  const step = bookingStep(booking);
  const last = BOOKING_STEPS.length - 1;
  const fill = useSharedValue(step / last);

  useEffect(() => {
    fill.value = withSpring(step / last, { damping: 18, stiffness: 120 });
  }, [fill, step, last]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const label = t(`timeline.${BOOKING_STEPS[step]}`);

  return (
    <View style={styles.wrap} accessible accessibilityLabel={t('timeline.a11y', { step: label })}>
      <View style={styles.track}>
        <View style={styles.line}>
          <Animated.View style={[styles.lineFill, fillStyle]} />
        </View>
        <View style={styles.stops}>
          {BOOKING_STEPS.map((key, i) => (
            <View key={key} style={[styles.stop, i <= step && styles.stopDone]}>
              {i === step && step < last ? <PulseDot size={8} color={Colors.onPrimary} /> : null}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.labels}>
        <ThemedText type="label" color={Colors.primary} style={styles.current}>
          {label}
        </ThemedText>
        {step < last ? (
          <ThemedText type="label" color={Colors.textFaint}>
            {t(`timeline.${BOOKING_STEPS[step + 1]}`)} →
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const STOP = 18;

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  track: { height: STOP, justifyContent: 'center' },
  line: {
    position: 'absolute',
    left: STOP / 2,
    right: STOP / 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  lineFill: { height: 3, borderRadius: 2, backgroundColor: Colors.primary },
  stops: { flexDirection: 'row', justifyContent: 'space-between' },
  stop: {
    width: STOP,
    height: STOP,
    borderRadius: STOP / 2,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  current: { fontFamily: Fonts.semibold },
});
