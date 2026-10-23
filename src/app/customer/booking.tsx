import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { MomoSheet } from '@/components/momo-sheet';
import { DriverRow } from '@/components/driver-row';
import { CheckIcon } from '@/components/onboarding/illustrations';
import { Bookings, Payments, Trips } from '@/api/endpoints';
import { useLiveRefresh } from '@/api/realtime';
import type { Booking, Payment, PickupCode } from '@/api/types';
import { useRemote } from '@/hooks/use-remote';
import { useSession } from '@/store/session';
import { bookingProgress, bookingStatusKey, isActiveBooking } from '@/utils/booking';
import { useI18n, type MessageKey } from '@/i18n';

const BOOKING_EVENTS = ['booking.status_changed', 'booking.driver_assigned'];
const TRIP_EVENTS = [
  'trip.driver_en_route',
  'trip.driver_arrived',
  'trip.started',
  'trip.completed',
  'trip.pickup_code_rotated',
];

export default function BookingScreen() {
  const { session } = useSession();
  const { t, amount, departure } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const booking = useRemote(id ? () => Bookings.get(id) : null, [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [code, setCode] = useState<PickupCode | null>(null);

  const b = booking.data;
  const tripStatus = b?.tripStatus ?? null;
  const open = b && isActiveBooking(b);

  useLiveRefresh({
    room: id ? `booking:${id}` : null,
    events: BOOKING_EVENTS,
    onEvent: () => void booking.reload(),
    pollMs: 6000,
    enabled: Boolean(id && open),
  });
  useLiveRefresh({
    room: b?.tripId ? `trip:${b.tripId}` : null,
    events: TRIP_EVENTS,
    onEvent: () => void booking.reload(),
    enabled: Boolean(b?.tripId && open),
  });

  // the pickup code is drawn by the customer once the driver is at the car
  const tripId = b?.tripId ?? null;
  useEffect(() => {
    if (tripStatus === 'ARRIVED' && tripId && !code) void drawCode(tripId, setCode, setError);
  }, [tripStatus, tripId, code]);

  if (!session.user) return <Redirect href="/" />;
  if (!id) return <Redirect href="/customer/home" />;

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await booking.reload();
    } catch (e) {
      setError(errorMessage(e));
      await booking.reload();
    } finally {
      setBusy(false);
    }
  };

  const cancel = (bk: Booking) => {
    const go = () =>
      void run(() => (bk.tripId ? Trips.cancel(bk.tripId) : Bookings.cancel(bk.id)));
    if (Platform.OS === 'web') return go();
    Alert.alert(t('booking.cancelConfirm'), undefined, [
      { text: t('booking.keep'), style: 'cancel' },
      { text: t('booking.cancel'), style: 'destructive', onPress: go },
    ]);
  };

  const home = () => router.replace('/customer/home');

  if (!b) {
    return (
      <Screen centered onBack={home}>
        {booking.error ? (
          <>
            <FormError message={booking.error} />
            <Button title={t('common.tryAgain')} variant="secondary" onPress={() => void booking.reload()} />
          </>
        ) : (
          <ThemedText type="caption" style={{ textAlign: 'center' }}>
            {t('booking.loading')}
          </ThemedText>
        )}
      </Screen>
    );
  }

  const paid = b.status === 'COMPLETED';
  const payDue = b.status === 'DRIVER_ASSIGNED' && tripStatus === 'COMPLETED';
  const cancellable =
    b.status === 'PENDING' ||
    b.status === 'SCHEDULED' ||
    b.status === 'SEARCHING' ||
    (b.status === 'DRIVER_ASSIGNED' &&
      (tripStatus === 'NOT_STARTED' || tripStatus === 'DRIVER_EN_ROUTE' || tripStatus === 'ARRIVED'));

  const footer = paid || b.status === 'CANCELLED' || b.status === 'EXPIRED' ? (
    <Button title={t('booking.bookAnother')} variant={paid ? 'secondary' : 'primary'} onPress={() => router.replace('/customer/request')} />
  ) : payDue ? (
    <Button
      title={t('booking.pay', { amount: amount(b.amount) })}
      onPress={() => setPayOpen(true)}
      accessoryRight={<ChevronRight />}
      testID="booking-pay"
    />
  ) : b.status === 'PENDING' ? (
    <Button title={t('booking.startSearch')} loading={busy} onPress={() => void run(() => Bookings.confirm(b.id))} />
  ) : cancellable ? (
    <Button title={t('booking.cancel')} variant="ghost" loading={busy} onPress={() => cancel(b)} />
  ) : undefined;

  return (
    <Screen centered onBack={home} footer={footer}>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        {paid ? (
          <View style={styles.doneBadge}>
            <CheckIcon size={28} color={Colors.onPrimary} strokeWidth={2.4} />
          </View>
        ) : null}
        <ThemedText type="title">{t(headlineKey(b))}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {subline(b, t, departure)}
        </ThemedText>
      </Animated.View>

      {code && tripStatus === 'ARRIVED' ? (
        <View style={styles.codeCard} accessibilityLiveRegion="polite">
          <ThemedText type="label">{t('booking.pickupCode')}</ThemedText>
          <ThemedText style={styles.code} accessibilityLabel={t('booking.pickupCodeA11y', { code: code.code.split('').join(' ') })}>
            {code.code}
          </ThemedText>
          <ThemedText type="caption" style={{ textAlign: 'center' }}>
            {t('booking.pickupCodeHelp')}
          </ThemedText>
          <ThemedText
            type="small"
            color={Colors.primary}
            accessibilityRole="button"
            onPress={() => tripId && void drawCode(tripId, setCode, setError)}
            style={{ paddingVertical: Spacing.one }}>
            {t('booking.newCode')}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <ThemedText type="label" color={Colors.primary}>
            {t(`services.${b.serviceCode}`)}
          </ThemedText>
          <ThemedText type="label">{t(bookingStatusKey(b))}</ThemedText>
        </View>

        {b.status === 'DRIVER_ASSIGNED' || paid ? (
          <DriverRow driver={b.driver} plate={b.vehiclePlate} callable={b.status === 'DRIVER_ASSIGNED' && !payDue} />
        ) : b.status === 'SEARCHING' ? (
          <View style={styles.searching}>
            <View style={styles.pulse} />
            <ThemedText type="caption">{t('booking.lookingForDrivers')}</ThemedText>
          </View>
        ) : null}

        <View style={styles.route}>
          {b.startAt ? (
            <ThemedText type="label" color={Colors.primary}>
              {t('when.pickupAt', { when: departure(new Date(b.startAt)) })}
              {b.durationHours ? ` · ${t('booking.hours', { count: b.durationHours })}` : ''}
            </ThemedText>
          ) : b.durationHours ? (
            <ThemedText type="label" color={Colors.primary}>
              {t('booking.hoursBooking', { count: b.durationHours })}
            </ThemedText>
          ) : null}
          <ThemedText type="small" numberOfLines={1}>
            {b.pickupName}
          </ThemedText>
          {b.destinationName ? (
            <ThemedText type="label" numberOfLines={1}>
              {t('booking.to', { place: b.destinationName })}
            </ThemedText>
          ) : null}
        </View>

        {open ? (
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: bookingProgress(b) }]} />
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <ThemedText type="caption">{paid ? t('booking.totalPaid') : t('booking.fixedPrice')}</ThemedText>
          <ThemedText type="subtitle">{amount(b.amount)} RWF</ThemedText>
        </View>
      </View>

      <FormError message={error} />

      <MomoSheet
        visible={payOpen}
        title={t('booking.payTitle')}
        amount={b.amount}
        phone={session.user.phone}
        existing={
          // resume the latest attempt the booking reports (works after a reinstall)
          payment ??
          (b.payment
            ? { ...b.payment, amount: b.amount, currency: b.currency, providerCode: '', simulated: false, settledAt: null }
            : null)
        }
        start={async () => {
          // idempotent server-side: a retry returns the attempt already in flight
          const p = await Payments.collect(b.id);
          setPayment(p);
          return p;
        }}
        poll={(p) => Payments.get(p.id)}
        onSettled={async () => {
          setPayOpen(false);
          await booking.reload();
        }}
        onClose={() => setPayOpen(false)}
      />
    </Screen>
  );
}

/** Each draw rotates the code server-side; the previous one stops working. */
async function drawCode(tripId: string, onCode: (c: PickupCode) => void, onError: (m: string) => void) {
  try {
    onCode(await Trips.pickupCode(tripId));
  } catch (e) {
    onError(errorMessage(e));
  }
}

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

function headlineKey(b: Booking): MessageKey {
  if (b.status === 'COMPLETED') return 'booking.headline.completed';
  if (b.status === 'CANCELLED') return 'booking.headline.cancelled';
  if (b.status === 'EXPIRED') return 'booking.headline.expired';
  if (b.status === 'PENDING') return 'booking.headline.pending';
  if (b.status === 'SCHEDULED') return 'booking.headline.scheduled';
  if (b.status === 'SEARCHING') return 'booking.headline.searching';
  switch (b.tripStatus) {
    case 'DRIVER_EN_ROUTE':
      return 'booking.headline.enRoute';
    case 'ARRIVED':
      return 'booking.headline.arrived';
    case 'IN_PROGRESS':
      return 'booking.headline.inProgress';
    case 'COMPLETED':
      return 'booking.headline.tripCompleted';
    default:
      return 'booking.headline.assigned';
  }
}

function subline(b: Booking, t: Translate, departure: (d: Date | null) => string) {
  const when = b.startAt ? departure(new Date(b.startAt)) : null;
  if (b.status === 'COMPLETED') return t('booking.subline.completed');
  // the reason is free text from whoever cancelled; show it as written
  if (b.status === 'CANCELLED') return b.cancelReason ?? t('booking.subline.cancelled');
  if (b.status === 'EXPIRED') return t('booking.subline.expired');
  if (b.status === 'PENDING') return t('booking.subline.pending');
  if (b.status === 'SCHEDULED')
    return when ? t('booking.subline.scheduled', { when }) : t('booking.subline.scheduledNoTime');
  if (b.status === 'SEARCHING')
    return when && new Date(b.startAt!).getTime() > Date.now() + 15 * 60_000
      ? t('booking.subline.searchingLater', { when })
      : t('booking.subline.searching');
  switch (b.tripStatus) {
    case 'DRIVER_EN_ROUTE':
      return t('booking.subline.enRoute');
    case 'ARRIVED':
      return t('booking.subline.arrived');
    case 'IN_PROGRESS':
      return t('booking.subline.inProgress');
    case 'COMPLETED':
      return t('booking.subline.tripCompleted');
    default:
      return t('booking.subline.assigned');
  }
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.two },
  doneBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  codeCard: {
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.card,
    backgroundColor: Colors.primarySoft,
    padding: Spacing.three,
  },
  code: { fontFamily: Fonts.bold, fontSize: 36, lineHeight: 44, letterSpacing: 8, color: Colors.text, paddingLeft: 8 },
  card: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  searching: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 46 },
  pulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 5,
    borderColor: Colors.primaryTint,
  },
  route: { gap: 2 },
  track: { height: 4, borderRadius: 2, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
