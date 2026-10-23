import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { ServiceTile } from '@/components/ui/service-tile';
import { DriversMap } from '@/components/map/drivers-map';
import { PlacePicker } from '@/components/place-picker';
import { MoonIcon, PinIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { DriverRow } from '@/components/driver-row';
import { Bookings } from '@/api/endpoints';
import { useLiveRefresh } from '@/api/realtime';
import type { ServiceCode } from '@/api/types';
import { useLayout } from '@/hooks/use-layout';
import { useNearbyDrivers } from '@/hooks/use-nearby-drivers';
import { usePosition } from '@/hooks/use-position';
import { useRemote } from '@/hooks/use-remote';
import { useSession } from '@/store/session';
import { bookingProgress, bookingStatusKey, isActiveBooking } from '@/utils/booking';
import { useI18n, type MessageKey } from '@/i18n';

/**
 * Customer home: the live map of available drivers around you, with the
 * request launcher and any current trip in a sheet below it.
 */
export default function CustomerHome() {
  const { session } = useSession();
  const { t, amount, departure } = useI18n();
  const insets = useSafeAreaInsets();
  const { height, gutter, short } = useLayout();
  const [service, setService] = useState<ServiceCode>('BOB_NIGHT');
  const [picking, setPicking] = useState(false);
  const { position, center } = usePosition();
  const nearby = useNearbyDrivers(center, Boolean(session.user));

  const bookings = useRemote(session.user ? Bookings.list : null, [session.user?.id]);
  const activeId = bookings.data?.find(isActiveBooking)?.id ?? null;
  const detail = useRemote(activeId ? () => Bookings.get(activeId) : null, [activeId]);

  useLiveRefresh({
    events: ['booking.status_changed', 'booking.driver_assigned', 'trip.driver_en_route', 'trip.driver_arrived', 'trip.started', 'trip.completed'],
    onEvent: () => {
      void bookings.reload();
      void detail.reload();
    },
    enabled: Boolean(session.user),
  });

  if (!session.user) return <Redirect href="/" />;

  const firstName = session.user.displayName?.trim().split(' ')[0];
  const initial = (firstName?.[0] ?? '·').toUpperCase();
  const active = activeId && detail.data?.id === activeId ? detail.data : null;
  const mapHeight = Math.round(height * (short ? 0.4 : 0.48));

  const startRequest = (to?: { name: string; lat: number; lng: number }) =>
    router.push({
      pathname: '/customer/request',
      params: { service, ...(to ? { to: to.name, toLat: String(to.lat), toLng: String(to.lng) } : {}) },
    });

  return (
    <View style={styles.screen}>
      <View style={[styles.map, { height: mapHeight + 28 }]}>
        <DriversMap center={center} drivers={nearby.drivers} showPickup={Boolean(position)} />
      </View>

      <View style={[styles.topBar, { top: insets.top + Spacing.two, paddingHorizontal: gutter }]} pointerEvents="box-none">
        <View style={styles.greeting}>
          <ThemedText type="label">{t(greetingKey())}</ThemedText>
          <ThemedText type="subtitle" style={styles.greetName} numberOfLines={1}>
            {firstName ?? t('home.welcome')}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/account')}
          accessibilityRole="button"
          accessibilityLabel={t('common.yourAccount')}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}>
          <ThemedText style={styles.avatarText}>{initial}</ThemedText>
        </Pressable>
      </View>

      {nearby.supported ? (
        <View style={[styles.nearbyPill, { top: mapHeight - 44, left: gutter }]} accessibilityLiveRegion="polite">
          <View style={[styles.liveDot, nearby.drivers.length === 0 && { backgroundColor: Colors.borderStrong }]} />
          <ThemedText type="label" color={Colors.text}>
            {nearby.drivers.length === 0
              ? t('home.noneNearby')
              : t('home.nearby', { count: nearby.drivers.length })}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.sheet, { marginTop: mapHeight }]}>
        <ScrollView
          contentContainerStyle={[styles.sheetContent, { paddingHorizontal: gutter, paddingBottom: insets.bottom + Spacing.four }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.handle} />

          {active ? (
            <Pressable
              onPress={() => router.push({ pathname: '/customer/booking', params: { id: active.id } })}
              accessibilityRole="button"
              accessibilityLabel={t('home.currentTripA11y', { status: t(bookingStatusKey(active)) })}
              style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.92 }]}>
              <View style={styles.tripTop}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <ThemedText type="label" color={Colors.primary} numberOfLines={1}>
                    {t(bookingStatusKey(active))}
                  </ThemedText>
                </View>
                <ThemedText type="label" numberOfLines={1}>
                  {amount(active.amount)} RWF
                </ThemedText>
              </View>
              {active.status === 'DRIVER_ASSIGNED' ? (
                <DriverRow driver={active.driver} plate={active.vehiclePlate} trailing={<ChevronRight color={Colors.textFaint} size={18} />} />
              ) : (
                <View style={styles.tripRoute}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemedText type="small" numberOfLines={1}>
                      {active.pickupName}
                      {active.destinationName ? ` → ${active.destinationName}` : ''}
                    </ThemedText>
                    <ThemedText type="label">
                      {t(`services.${active.serviceCode}`)} · {departure(active.startAt ? new Date(active.startAt) : null)}
                    </ThemedText>
                  </View>
                  <ChevronRight color={Colors.textFaint} size={18} />
                </View>
              )}
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: bookingProgress(active) }]} />
              </View>
            </Pressable>
          ) : null}

          <ThemedText type="subtitle">{t('home.whereTo')}</ThemedText>
          <Pressable
            onPress={() => setPicking(true)}
            disabled={Boolean(activeId)}
            accessibilityRole="button"
            accessibilityLabel={t('home.searchA11y')}
            style={({ pressed }) => [styles.search, pressed && { backgroundColor: Colors.surfaceAlt }, activeId && { opacity: 0.5 }]}>
            <PinIcon size={20} color={Colors.primary} />
            <ThemedText color={Colors.textFaint} style={{ flex: 1 }} numberOfLines={1}>
              {t('places.searchPlaceholder')}
            </ThemedText>
          </Pressable>

          <View style={styles.services} accessibilityRole="radiogroup">
            <ServiceTile
              active={service === 'BOB_NIGHT'}
              onPress={() => setService('BOB_NIGHT')}
              icon={(color) => <MoonIcon size={22} color={color} />}
              title={t('services.BOB_NIGHT')}
              copy={t('services.bobNightCopy')}
            />
            <ServiceTile
              active={service === 'PRIVATE_DRIVER'}
              onPress={() => setService('PRIVATE_DRIVER')}
              icon={(color) => <WheelIcon size={22} color={color} />}
              title={t('services.PRIVATE_DRIVER')}
              copy={t('services.privateDriverCopy')}
            />
          </View>

          <Button
            title={t('home.request')}
            disabled={Boolean(activeId)}
            onPress={() => startRequest()}
            accessoryRight={<ChevronRight />}
          />
          <ThemedText type="label" style={styles.center}>
            {activeId ? t('home.hintActive') : t('home.hint')}
          </ThemedText>
        </ScrollView>
      </View>

      <PlacePicker
        visible={picking}
        title={t('home.whereTo')}
        near={position ?? undefined}
        onClose={() => setPicking(false)}
        onPick={(place) => {
          setPicking(false);
          startRequest(place);
        }}
      />
    </View>
  );
}

function greetingKey(): MessageKey {
  const h = new Date().getHours();
  if (h < 12) return 'home.morning';
  if (h < 18) return 'home.afternoon';
  return 'home.evening';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  map: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.surfaceAlt },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  greeting: {
    flexShrink: 1,
    borderRadius: Radius.field,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...Shadow,
  },
  greetName: { fontSize: 17, lineHeight: 22 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
  },
  avatarText: { fontFamily: Fonts.bold, fontSize: 17, color: Colors.primary },
  nearbyPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Shadow,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryBright },
  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Shadow,
  },
  sheetContent: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three,
  },
  services: { flexDirection: 'row', gap: Spacing.two },
  center: { textAlign: 'center' },
  tripCard: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.primaryTint,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  tripTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  tripRoute: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  track: { height: 4, borderRadius: 2, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: Colors.primary },
});
