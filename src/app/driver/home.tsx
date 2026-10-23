import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Fonts, Radius, Shadow, ShadowLifted, Spacing } from '@/constants/theme';
import { Photos } from '@/constants/images';
import { Photo, Scrim } from '@/components/ui/photo';
import { PulseDot } from '@/components/ui/pulse-dot';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { MoonIcon, PinIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { Drivers, Trips } from '@/api/endpoints';
import { useLiveRefresh } from '@/api/realtime';
import type { Offer } from '@/api/types';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { useRemote } from '@/hooks/use-remote';
import { canWork, useSession } from '@/store/session';
import { useI18n, type MessageKey } from '@/i18n';

/**
 * The operational hub, reachable only for an approved driver. The switch
 * drives the location heartbeat; offers arrive over the socket (with polling
 * as a fallback) and expire in about 30 seconds.
 */
export default function DriverHome() {
  const { session } = useSession();
  const { t } = useI18n();
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heartbeat = useHeartbeat(online);
  const offers = useRemote(session.user && online ? Drivers.offers : null, [session.user?.id, online]);
  const trips = useRemote(session.user ? Trips.active : null, [session.user?.id]);

  useLiveRefresh({
    events: ['dispatch.offer', 'dispatch.offer_withdrawn'],
    onEvent: () => void offers.reload(),
    pollMs: 5000,
    enabled: online,
  });

  // going offline clears whatever was on screen
  useEffect(() => {
    if (!online) offers.setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  if (!session.user) return <Redirect href="/" />;
  if (!canWork(session)) return <Redirect href="/driver/status" />;

  const firstName = session.user.displayName?.split(' ')[0];
  const activeTrip = trips.data?.[0];
  // expired offers drop out on the next poll; the countdown shows 0s until then
  const pending = (offers.data ?? []).filter((o) => o.status === 'PENDING');

  const accept = async (offer: Offer) => {
    setBusy(offer.id);
    setError(null);
    try {
      const booking = await Drivers.accept(offer.id);
      if (booking.tripId) router.push({ pathname: '/driver/trip', params: { id: booking.tripId } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
      void offers.reload();
      void trips.reload();
    }
  };

  const decline = async (offer: Offer) => {
    setBusy(offer.id);
    try {
      await Drivers.decline(offer.id);
    } catch {
      // already expired or taken — the refresh below clears it either way
    } finally {
      setBusy(null);
      void offers.reload();
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        <Photo source={online ? Photos.kigaliNightWide : Photos.wheelWide} priority="high" />
        <Scrim
          stops={[
            [0, 0.5],
            [0.4, 0.15],
            [1, 0.9],
          ]}
        />
        <View style={styles.heroTop}>
          <ThemedText type="label" color={Colors.onNightDim} numberOfLines={1} style={{ flex: 1 }}>
            {firstName ? t('hub.hi', { name: firstName }) : t('hub.driver')}
          </ThemedText>
          <Pressable
            onPress={() => router.push('/account')}
            accessibilityRole="button"
            accessibilityLabel={t('common.yourAccount')}
            style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}>
            <ThemedText style={styles.avatarText}>{(firstName?.[0] ?? '·').toUpperCase()}</ThemedText>
          </Pressable>
        </View>
        <View style={styles.heroBottom}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={styles.statusRow}>
              <PulseDot size={10} active={online} />
              <ThemedText type="title" style={styles.greeting}>
                {online ? t('hub.online') : t('hub.offline')}
              </ThemedText>
            </View>
            <ThemedText type="label" color={Colors.onNightDim}>
              {online ? t('hub.availableOn') : t('hub.availableOff')}
            </ThemedText>
          </View>
          <Switch on={online} onToggle={() => setOnline((v) => !v)} label={t('hub.available')} />
        </View>
      </Animated.View>

      {activeTrip ? (
        <Pressable
          onPress={() => router.push({ pathname: '/driver/trip', params: { id: activeTrip.id } })}
          accessibilityRole="button"
          accessibilityLabel={t('hub.openTripA11y')}
          style={({ pressed }) => [styles.card, styles.tripCard, pressed && { opacity: 0.9 }]}>
          <View style={styles.tripIcon}>
            <WheelIcon size={22} color={Colors.onPrimary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ThemedText type="subtitle" style={{ fontSize: 17, lineHeight: 22 }}>
              {t('hub.currentTrip')}
            </ThemedText>
            <ThemedText type="caption">{t(tripLabelKey(activeTrip.status))}</ThemedText>
          </View>
          <ChevronRight color={Colors.textFaint} size={18} />
        </Pressable>
      ) : null}

      {pending.length > 0 ? (
        pending.map((offer) => (
          <Animated.View key={offer.id} entering={FadeInDown.duration(320)} style={styles.offerCard} accessibilityLiveRegion="polite">
            <View style={styles.offerTop}>
              <View style={styles.offerTag}>
                {offer.booking.serviceType.code === 'BOB_NIGHT' ? (
                  <MoonIcon size={14} color={Colors.dusk} />
                ) : (
                  <WheelIcon size={14} color={Colors.dusk} />
                )}
                <ThemedText type="label" color={Colors.dusk}>
                  {t(`services.${offer.booking.serviceType.code}`)}
                </ThemedText>
              </View>
              <Countdown until={offer.expiresAt} />
            </View>
            <OfferTimer until={offer.expiresAt} />
            <View style={styles.stop}>
              <PinIcon size={20} color={Colors.primary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText type="small" numberOfLines={1}>
                  {offer.booking.pickupName}
                </ThemedText>
                <ThemedText type="label">
                  {t('hub.pickupLine', { gearbox: t(`transmission.${offer.booking.vehicleTransmission}`) })}
                </ThemedText>
              </View>
            </View>
            <View style={styles.offerRow}>
              <Button
                title={t('hub.decline')}
                size="md"
                variant="secondary"
                style={{ flex: 1 }}
                disabled={busy !== null}
                onPress={() => void decline(offer)}
              />
              <Button
                title={t('hub.accept')}
                size="md"
                style={{ flex: 1 }}
                loading={busy === offer.id}
                disabled={busy !== null}
                onPress={() => void accept(offer)}
              />
            </View>
          </Animated.View>
        ))
      ) : !activeTrip ? (
        <View style={[styles.card, styles.waiting]}>
          <View style={[styles.waitIcon, !online && styles.waitIconOff]}>
            <PulseDot size={12} active={online} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <ThemedText type="subtitle" style={{ fontSize: 17, lineHeight: 22 }}>
              {online ? t('hub.waiting') : t('hub.goOnline')}
            </ThemedText>
            <ThemedText type="caption">
              {online ? t('hub.waitingCopy') : t('hub.offlineCopy')}
            </ThemedText>
          </View>
        </View>
      ) : null}

      <FormError message={error ?? (online ? heartbeat.error : null)} />

    </Screen>
  );
}

/** The availability switch: the knob springs across and the track fills green. */
function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  const x = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    x.value = withSpring(on ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [on, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 26 }] }));
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(x.value, [0, 1], ['rgba(255,255,255,0.28)', Colors.primaryBright]),
  }));
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle();
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      hitSlop={8}>
      <Animated.View style={[styles.switch, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

/** Thin bar draining as an offer's ~30 seconds run out. */
function OfferTimer({ until }: { until: string }) {
  const left = useSharedValue(1);
  useEffect(() => {
    const ms = Math.max(0, new Date(until).getTime() - Date.now());
    left.value = Math.min(1, ms / OFFER_MS);
    left.value = withTiming(0, { duration: ms, easing: Easing.linear });
  }, [until, left]);
  const style = useAnimatedStyle(() => ({
    width: `${left.value * 100}%`,
    backgroundColor: left.value < 0.33 ? Colors.danger : Colors.primary,
  }));
  return (
    <View style={styles.timer}>
      <Animated.View style={[styles.timerFill, style]} />
    </View>
  );
}

const OFFER_MS = 30_000;

/** Seconds left on an offer; it disappears on its own when the server expires it. */
function Countdown({ until }: { until: string }) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.round((new Date(until).getTime() - now) / 1000));
  return (
    <ThemedText type="label" color={left <= 10 ? Colors.danger : Colors.textDim}>
      {t('hub.secondsLeft', { count: left })}
    </ThemedText>
  );
}

function tripLabelKey(status: string): MessageKey {
  switch (status) {
    case 'DRIVER_EN_ROUTE':
      return 'hub.tripEnRoute';
    case 'ARRIVED':
      return 'hub.tripArrived';
    case 'IN_PROGRESS':
      return 'hub.tripInProgress';
    default:
      return 'hub.tripAccepted';
  }
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three },
  hero: {
    height: 232,
    borderRadius: Radius.card + 4,
    overflow: 'hidden',
    backgroundColor: Colors.night,
    justifyContent: 'space-between',
    padding: Spacing.three,
    ...ShadowLifted,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  greeting: { fontSize: 28, lineHeight: 34, color: Colors.onNight },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.onNight },
  switch: { width: 58, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center' },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surface },
  timer: { height: 4, borderRadius: 2, backgroundColor: Colors.surfaceAlt, overflow: 'hidden', marginTop: -Spacing.one },
  timerFill: { height: 4, borderRadius: 2 },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  tripCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderColor: Colors.primaryTint },
  tripIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  waitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitIconOff: { backgroundColor: Colors.surfaceAlt },
  offerCard: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.duskSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  offerRow: { flexDirection: 'row', gap: Spacing.two },
});
