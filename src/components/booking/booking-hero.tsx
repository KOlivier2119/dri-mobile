import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors, Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { DriversMap } from '@/components/map/drivers-map';
import { CarMarker } from '@/components/map/car-marker';
import { PulseDot } from '@/components/ui/pulse-dot';
import { CheckIcon, PinIcon } from '@/components/onboarding/illustrations';
import type { Booking } from '@/api/types';
import { useNearbyDrivers } from '@/hooks/use-nearby-drivers';
import { useI18n } from '@/i18n';

const HEIGHT = 196;

/** The moving picture at the top of the booking screen; changes with the stage. */
export function BookingHero({ booking }: { booking: Booking }) {
  if (booking.status === 'COMPLETED') return <DoneHero />;
  if (booking.status === 'SEARCHING' || booking.status === 'PENDING' || booking.status === 'SCHEDULED') {
    return <SearchHero booking={booking} />;
  }
  if (booking.status === 'DRIVER_ASSIGNED') {
    if (booking.tripStatus === 'COMPLETED') return <DoneHero />;
    return <RoadHero stage={booking.tripStatus} />;
  }
  return null;
}

/** Live map of drivers around the pickup with a radar sweeping out from it. */
function SearchHero({ booking }: { booking: Booking }) {
  const { t } = useI18n();
  const center = { lat: booking.pickupLat, lng: booking.pickupLng };
  const nearby = useNearbyDrivers(center);
  const searching = booking.status === 'SEARCHING';
  const elapsed = useElapsed(booking.createdAt, searching);

  return (
    <View style={styles.frame}>
      <DriversMap center={center} drivers={nearby.drivers} showPickup />
      {searching ? (
        <View style={styles.radar} pointerEvents="none">
          {[0, 1, 2].map((i) => (
            <RadarRing key={i} delay={i * 900} />
          ))}
        </View>
      ) : null}
      <View style={styles.chips} pointerEvents="none">
        {nearby.supported ? (
          <View style={styles.chip}>
            <PulseDot active={nearby.drivers.length > 0} />
            <ThemedText type="label" color={Colors.text}>
              {nearby.drivers.length === 0 ? t('home.noneNearby') : t('home.nearby', { count: nearby.drivers.length })}
            </ThemedText>
          </View>
        ) : null}
        {searching && elapsed ? (
          <View style={styles.chip}>
            <ThemedText type="label" color={Colors.text} style={styles.mono}>
              {t('wait.searchingFor', { time: elapsed })}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RadarRing({ delay }: { delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1, false));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - t.value),
    transform: [{ scale: 0.2 + t.value * 2.4 }],
  }));
  return <Animated.View style={[styles.ring, style]} />;
}

/** "m:ss" since `from`, ticking every second while `running`. */
function useElapsed(from: string, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const seconds = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  if (!running || !Number.isFinite(seconds)) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** A road scrolling under your car: slow on the way, stopped at the pickup pin, brisk on the trip. */
function RoadHero({ stage }: { stage: Booking['tripStatus'] }) {
  const arrived = stage === 'ARRIVED';
  const speed = stage === 'IN_PROGRESS' ? 700 : stage === 'DRIVER_EN_ROUTE' ? 1100 : 2200;
  const offset = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (arrived) {
      offset.value = withTiming(0, { duration: 400 });
      bob.value = withTiming(0);
      return;
    }
    offset.value = 0;
    offset.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.linear }), -1, false);
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(0, { duration: 260 })), -1, false);
  }, [arrived, speed, offset, bob]);

  return (
    <View style={[styles.frame, styles.roadFrame]}>
      <View style={styles.hills} />
      <View style={styles.road}>
        <Dashes offset={offset} />
      </View>
      {arrived ? (
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.pin}>
          <PinIcon size={30} color={Colors.primary} />
        </Animated.View>
      ) : null}
      <Car bob={bob} arrived={arrived} />
    </View>
  );
}

const DASH = 34;
const GAP = 26;

function Dashes({ offset }: { offset: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -offset.value * (DASH + GAP) }] }));
  return (
    <Animated.View style={[styles.dashes, style]}>
      {Array.from({ length: 24 }, (_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </Animated.View>
  );
}

function Car({ bob, arrived }: { bob: SharedValue<number>; arrived: boolean }) {
  const x = useSharedValue(arrived ? 1 : 0);
  useEffect(() => {
    x.value = withSpring(arrived ? 1 : 0, { damping: 16, stiffness: 90 });
  }, [arrived, x]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 54 }, { translateY: -bob.value * 1.5 }, { rotate: '90deg' }],
  }));
  return (
    <Animated.View style={[styles.car, style]}>
      <CarMarker size={58} />
    </Animated.View>
  );
}

/** Check mark that pops in with a soft ring burst behind it. */
function DoneHero() {
  const burst = useSharedValue(0);
  useEffect(() => {
    burst.value = withDelay(150, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [burst]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - burst.value, transform: [{ scale: 1 + burst.value * 1.4 }] }));
  return (
    <View style={[styles.frame, styles.doneFrame]}>
      <Animated.View style={[styles.burst, ring]} />
      <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.doneBadge}>
        <CheckIcon size={40} color={Colors.onPrimary} strokeWidth={2.6} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: HEIGHT,
    borderRadius: Radius.card + 4,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
    ...Shadow,
  },
  radar: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(11, 122, 87, 0.10)',
  },
  chips: {
    position: 'absolute',
    left: Spacing.two + 2,
    right: Spacing.two + 2,
    bottom: Spacing.two + 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...Shadow,
  },
  mono: { fontFamily: Fonts.semibold, fontVariant: ['tabular-nums'] },
  roadFrame: { backgroundColor: Colors.primarySoft, justifyContent: 'center' },
  hills: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -HEIGHT * 0.9,
    height: HEIGHT * 1.35,
    borderRadius: HEIGHT,
    backgroundColor: Colors.primaryTint,
    opacity: 0.55,
  },
  road: {
    height: 64,
    backgroundColor: '#2B3631',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: HEIGHT * 0.22,
  },
  dashes: { flexDirection: 'row', gap: GAP, paddingLeft: GAP },
  dash: { width: DASH, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  pin: { position: 'absolute', left: '50%', top: HEIGHT * 0.22, marginLeft: 44 },
  car: { position: 'absolute', left: '50%', top: HEIGHT / 2 + HEIGHT * 0.11 - 29, marginLeft: -29 },
  doneFrame: { backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryTint },
  doneBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
