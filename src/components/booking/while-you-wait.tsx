import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/onboarding/illustrations';
import type { Booking } from '@/api/types';
import { bookingStatusKey } from '@/utils/booking';
import { useI18n, type MessageKey } from '@/i18n';

const ITEMS = ['keys', 'fuel', 'papers', 'spot'] as const;
type Item = (typeof ITEMS)[number];

/**
 * Things worth doing before the driver reaches the car: a checklist (kept per
 * booking on the device), safety reminders with trip sharing, and the
 * Umuganda reminder when the pickup falls on a Saturday.
 */
export function WhileYouWait({ booking }: { booking: Booking }) {
  const { t } = useI18n();
  const beforePickup =
    booking.status !== 'DRIVER_ASSIGNED' ||
    booking.tripStatus === 'NOT_STARTED' ||
    booking.tripStatus === 'DRIVER_EN_ROUTE' ||
    booking.tripStatus === null;
  const saturday = booking.startAt ? new Date(booking.startAt).getDay() === 6 : false;

  return (
    <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.section}>
      <ThemedText type="overline" style={styles.overline}>
        {t('wait.title')}
      </ThemedText>
      {beforePickup ? <Checklist bookingId={booking.id} /> : null}
      {saturday && booking.status === 'SCHEDULED' ? <Umuganda /> : null}
      <Safety booking={booking} />
    </Animated.View>
  );
}

function Checklist({ bookingId }: { bookingId: string }) {
  const { t } = useI18n();
  const key = `dri.checklist.${bookingId}`;
  const [done, setDone] = useState<Item[]>([]);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (live && raw) setDone(JSON.parse(raw) as Item[]);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);

  const toggle = (item: Item) => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    const next = done.includes(item) ? done.filter((d) => d !== item) : [...done, item];
    setDone(next);
    void AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
  };

  const all = done.length === ITEMS.length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          {t('wait.checklistTitle')}
        </ThemedText>
        <ThemedText type="label" color={all ? Colors.primary : Colors.textFaint}>
          {t('wait.checklistProgress', { done: done.length, total: ITEMS.length })}
        </ThemedText>
      </View>
      <View style={styles.meter}>
        <Animated.View layout={LinearTransition.springify().damping(18)} style={[styles.meterFill, { width: `${(done.length / ITEMS.length) * 100}%` }]} />
      </View>
      <View accessibilityRole="list">
        {ITEMS.map((item) => {
          const on = done.includes(item);
          return (
            <Pressable
              key={item}
              onPress={() => toggle(item)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
              <View style={[styles.box, on && styles.boxOn]}>
                {on ? (
                  <Animated.View entering={ZoomIn.springify().damping(12)}>
                    <CheckIcon size={14} color={Colors.onPrimary} strokeWidth={2.8} />
                  </Animated.View>
                ) : null}
              </View>
              <ThemedText type="body" style={[styles.itemText, on && styles.itemDone]}>
                {t(`wait.${item}` as MessageKey)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {all ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.allSet}>
          <ThemedText type="small" color={Colors.primary}>
            {t('wait.checklistDone')}
          </ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Safety({ booking }: { booking: Booking }) {
  const { t } = useI18n();
  const share = async () => {
    const lines = [
      t('wait.shareMessage', {
        from: booking.pickupName,
        to: booking.destinationName ?? '—',
        status: t(bookingStatusKey(booking)),
      }),
    ];
    if (booking.driver?.displayName) {
      lines.push(t('wait.shareDriver', { driver: booking.driver.displayName, plate: booking.vehiclePlate }));
    }
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // dismissed, or the browser has no share sheet
    }
  };

  const tips: MessageKey[] = ['wait.safetyName', 'wait.safetyCode', 'wait.safetyShare'];
  return (
    <View style={[styles.card, styles.safety]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {t('wait.safetyTitle')}
      </ThemedText>
      {tips.map((tip, i) => (
        <View key={tip} style={styles.tip}>
          <ThemedText style={styles.tipNo}>{i + 1}</ThemedText>
          <ThemedText type="caption" color={Colors.text} style={styles.tipText}>
            {t(tip)}
          </ThemedText>
        </View>
      ))}
      <Button title={t('wait.share')} variant="secondary" size="md" onPress={() => void share()} />
    </View>
  );
}

function Umuganda() {
  const { t } = useI18n();
  return (
    <View style={[styles.card, styles.umuganda]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {t('wait.umugandaTitle')}
      </ThemedText>
      <ThemedText type="caption" color={Colors.text}>
        {t('wait.umugandaCopy')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two + 2 },
  overline: { color: Colors.textFaint },
  card: {
    gap: Spacing.two + 2,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  cardTitle: { fontSize: 17, lineHeight: 22, flexShrink: 1 },
  meter: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  itemText: { flex: 1, fontSize: 15, lineHeight: 21 },
  itemDone: { color: Colors.textFaint, textDecorationLine: 'line-through' },
  allSet: { borderRadius: Radius.field, backgroundColor: Colors.primarySoft, padding: Spacing.two + 2 },
  safety: { backgroundColor: Colors.surface },
  tip: { flexDirection: 'row', gap: Spacing.two + 2, alignItems: 'flex-start' },
  tipNo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: Colors.primarySoft,
    color: Colors.primary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 22,
  },
  tipText: { flex: 1 },
  umuganda: { backgroundColor: Colors.sunSoft, borderColor: Colors.sunSoft },
});
