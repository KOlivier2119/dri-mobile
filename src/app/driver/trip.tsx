import * as Location from 'expo-location';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { OtpInput } from '@/components/ui/otp-input';
import { Screen } from '@/components/ui/screen';
import { CheckIcon, PinIcon } from '@/components/onboarding/illustrations';
import { Trips } from '@/api/endpoints';
import { useLiveRefresh } from '@/api/realtime';
import type { TripStatus } from '@/api/types';
import { useRemote } from '@/hooks/use-remote';
import { inAppPayments, useSession } from '@/store/session';
import { useI18n, type MessageKey } from '@/i18n';

const TRAIL_MS = 20_000;

/**
 * Driver-side trip: en route → arrived → start (with the customer's 6-digit
 * pickup code) → complete. Every transition is a server-guarded edge; a 409
 * means the trip moved on (e.g. the customer cancelled), so we just refetch.
 */
export default function DriverTripScreen() {
  const { session } = useSession();
  const { t, amount } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const trip = useRemote(id ? () => Trips.get(id) : null, [id]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = trip.data?.status;
  // trip detail carries the job and, while live, the rider's contact
  const booking = trip.data?.booking ?? null;
  const customer = trip.data?.customer ?? null;
  const live = status === 'NOT_STARTED' || status === 'DRIVER_EN_ROUTE' || status === 'ARRIVED' || status === 'IN_PROGRESS';

  useLiveRefresh({
    room: id ? `trip:${id}` : null,
    events: ['trip.driver_en_route', 'trip.driver_arrived', 'trip.started', 'trip.completed', 'booking.status_changed'],
    onEvent: () => void trip.reload(),
    pollMs: 8000,
    enabled: Boolean(id && live),
  });

  useTrail(id ?? null, status === 'IN_PROGRESS');

  if (!session.user) return <Redirect href="/" />;
  if (!id) return <Redirect href="/driver/home" />;

  const act = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      await trip.reload();
      setBusy(false);
    }
  };

  const navigate = () => {
    if (!booking) return;
    const { pickupLat: lat, pickupLng: lng } = booking;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    void Linking.openURL(url);
  };

  const footer = !status ? undefined : status === 'NOT_STARTED' ? (
    <Button title={t('trip.onMyWay')} loading={busy} onPress={() => void act(() => Trips.enRoute(id))} accessoryRight={<ChevronRight />} />
  ) : status === 'DRIVER_EN_ROUTE' ? (
    <Button title={t('trip.arrived')} loading={busy} onPress={() => void act(() => Trips.arrived(id))} accessoryRight={<ChevronRight />} />
  ) : status === 'ARRIVED' ? (
    <Button
      title={t('trip.start')}
      loading={busy}
      disabled={code.length !== 6}
      onPress={() => void act(() => Trips.start(id, code))}
      accessoryRight={<ChevronRight />}
    />
  ) : status === 'IN_PROGRESS' ? (
    <Button title={t('trip.complete')} loading={busy} onPress={() => void act(() => Trips.complete(id))} accessoryRight={<ChevronRight />} />
  ) : (
    <Button title={t('trip.backHome')} variant="secondary" onPress={() => router.replace('/driver/home')} />
  );

  return (
    <Screen onBack={() => router.replace('/driver/home')} footer={footer}>
      <View style={styles.hero}>
        {status === 'COMPLETED' ? (
          <View style={styles.doneBadge}>
            <CheckIcon size={28} color={Colors.onPrimary} strokeWidth={2.4} />
          </View>
        ) : null}
        <ThemedText type="title">{t(headlineKey(status))}</ThemedText>
        {sublineKey(status, inAppPayments(session)) ? (
          <ThemedText type="body" color={Colors.textDim}>
            {t(sublineKey(status, inAppPayments(session))!)}
          </ThemedText>
        ) : null}
      </View>

      {booking ? (
        <View style={styles.card}>
          <ThemedText type="label" color={Colors.primary}>
            {t(`services.${booking.serviceCode}`)}
          </ThemedText>
          <View style={styles.stop}>
            <PinIcon size={22} color={Colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText type="subtitle" style={{ fontSize: 17, lineHeight: 22 }} numberOfLines={2}>
                {booking.pickupName}
              </ThemedText>
              {booking.destinationName ? (
                <ThemedText type="caption" numberOfLines={1}>
                  {t('trip.to', { place: booking.destinationName })}
                </ThemedText>
              ) : null}
            </View>
          </View>
          <View style={styles.metaRow}>
            <Meta label={t('trip.car')} value={`${booking.vehiclePlate} · ${t(`transmission.${booking.vehicleTransmission}`)}`} />
            <Meta label={t('trip.fare')} value={`${amount(booking.amount)} RWF`} />
          </View>
          {customer ? (
            <View style={styles.riderRow}>
              <Meta label={t('trip.rider')} value={customer.displayName ?? t('trip.riderFallback')} />
              {customer.phone ? (
                <Button
                  title={t('trip.callRider')}
                  size="md"
                  variant="secondary"
                  onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
                />
              ) : null}
            </View>
          ) : null}
          {status === 'NOT_STARTED' || status === 'DRIVER_EN_ROUTE' ? (
            <Button title={t('trip.navigate')} variant="secondary" size="md" onPress={navigate} />
          ) : null}
        </View>
      ) : null}

      {status === 'ARRIVED' ? (
        <View style={styles.codeBox}>
          <ThemedText type="label" style={{ textAlign: 'center' }}>
            {t('trip.askCode')}
          </ThemedText>
          <OtpInput value={code} onChange={setCode} disabled={busy} error={!!error} />
        </View>
      ) : null}

      <FormError message={error ?? trip.error} />
    </Screen>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <ThemedText type="label">{label}</ThemedText>
      <ThemedText type="small" numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

/** Appends the driver's position to the trip trail while it's in progress. */
function useTrail(tripId: string | null, active: boolean) {
  const sending = useRef(false);
  useEffect(() => {
    if (!tripId || !active) return;
    const send = async () => {
      if (sending.current) return;
      sending.current = true;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await Trips.sendLocations(tripId, [
          { lng: pos.coords.longitude, lat: pos.coords.latitude, sampledAt: new Date(pos.timestamp).toISOString() },
        ]);
      } catch {
        // best effort: the trail is a nice-to-have, never a blocker
      } finally {
        sending.current = false;
      }
    };
    void send();
    const timer = setInterval(() => void send(), TRAIL_MS);
    return () => clearInterval(timer);
  }, [tripId, active]);
}

function headlineKey(status?: TripStatus): MessageKey {
  switch (status) {
    case 'DRIVER_EN_ROUTE':
      return 'trip.headline.enRoute';
    case 'ARRIVED':
      return 'trip.headline.arrived';
    case 'IN_PROGRESS':
      return 'trip.headline.inProgress';
    case 'COMPLETED':
      return 'trip.headline.completed';
    case 'CANCELLED':
      return 'trip.headline.cancelled';
    case 'INTERRUPTED':
      return 'trip.headline.interrupted';
    case 'NOT_STARTED':
      return 'trip.headline.notStarted';
    default:
      return 'trip.headline.loading';
  }
}

function sublineKey(status: TripStatus | undefined, paysInApp: boolean): MessageKey | null {
  switch (status) {
    case 'NOT_STARTED':
      return 'trip.subline.notStarted';
    case 'DRIVER_EN_ROUTE':
      return 'trip.subline.enRoute';
    case 'ARRIVED':
      return 'trip.subline.arrived';
    case 'IN_PROGRESS':
      return 'trip.subline.inProgress';
    case 'COMPLETED':
      // with no in-app payment the driver collects the fare in person
      return paysInApp ? 'trip.subline.completed' : 'offApp.driverCompleted';
    case 'CANCELLED':
      return 'trip.subline.cancelled';
    case 'INTERRUPTED':
      return 'trip.subline.interrupted';
    default:
      return null;
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
  card: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  stop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  metaRow: { flexDirection: 'row', gap: Spacing.three },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  codeBox: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    backgroundColor: Colors.primarySoft,
    padding: Spacing.three,
  },
});
