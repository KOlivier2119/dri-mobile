import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Segmented } from '@/components/ui/segmented';
import { ClockIcon } from '@/components/onboarding/illustrations';
import { useI18n } from '@/i18n';

/** A scheduled pickup must leave the driver time to get there. */
export const MIN_LEAD_MINUTES = 30;
const DAYS_AHEAD = 7;
const MINUTES = [0, 15, 30, 45];

/** Earliest bookable slot: now + lead, rounded up to the next quarter hour. */
export function earliestSlot(now = new Date()) {
  const t = new Date(now.getTime() + MIN_LEAD_MINUTES * 60_000);
  t.setSeconds(0, 0);
  const rem = t.getMinutes() % 15;
  if (rem) t.setMinutes(t.getMinutes() + (15 - rem));
  return t;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** `null` = as soon as possible; a Date = scheduled departure. */
export function WhenPicker({ value, onChange }: { value: Date | null; onChange: (value: Date | null) => void }) {
  const { t, departure, weekday } = useI18n();
  const earliest = useMemo(() => earliestSlot(), []);
  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = new Date(earliest);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [earliest],
  );

  const selected = value ?? earliest;
  const valid = (d: Date) => d.getTime() >= earliest.getTime();

  const set = (day: Date, hour: number, minute: number) => {
    const next = new Date(day);
    next.setHours(hour, minute, 0, 0);
    onChange(valid(next) ? next : earliest);
  };

  return (
    <View style={styles.container}>
      <Segmented
        label={t('when.label')}
        value={value ? 'later' : 'now'}
        onChange={(v) => onChange(v === 'now' ? null : earliest)}
        options={[
          { value: 'now', label: t('when.now') },
          { value: 'later', label: t('when.schedule') },
        ]}
      />

      {value ? (
        <View style={styles.panel}>
          <View style={styles.summary}>
            <ClockIcon size={18} color={Colors.primary} />
            <ThemedText type="small">{t('when.pickupAt', { when: departure(value) })}</ThemedText>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {days.map((d, i) => {
              const on = sameDay(d, selected);
              return (
                <Chip
                  key={d.toISOString()}
                  on={on}
                  top={i === 0 ? t('when.todayShort') : i === 1 ? t('when.tomorrowShort') : weekday(d)}
                  bottom={String(d.getDate())}
                  onPress={() => set(d, selected.getHours(), selected.getMinutes())}
                />
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {Array.from({ length: 24 }, (_, h) => h).map((h) => {
              const slot = new Date(selected);
              slot.setHours(h, 45, 0, 0);
              if (!valid(slot)) return null;
              const on = selected.getHours() === h;
              return (
                <Chip key={h} on={on} bottom={`${String(h).padStart(2, '0')}h`} onPress={() => set(selected, h, selected.getMinutes())} />
              );
            })}
          </ScrollView>

          <View style={styles.minutes}>
            {MINUTES.map((m) => {
              const slot = new Date(selected);
              slot.setMinutes(m, 0, 0);
              const disabled = !valid(slot);
              const on = selected.getMinutes() === m;
              return (
                <Pressable
                  key={m}
                  disabled={disabled}
                  onPress={() => set(selected, selected.getHours(), m)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled }}
                  style={[styles.minute, on && styles.chipOn, disabled && { opacity: 0.35 }]}>
                  <ThemedText type="small" color={on ? Colors.onPrimary : Colors.text}>
                    :{String(m).padStart(2, '0')}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="label">{t('when.arrivesBy')}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function Chip({ on, top, bottom, onPress }: { on: boolean; top?: string; bottom: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={top ? `${top} ${bottom}` : bottom}
      style={[styles.chip, on && styles.chipOn]}>
      {top ? (
        <ThemedText type="label" color={on ? Colors.onPrimary : Colors.textDim}>
          {top}
        </ThemedText>
      ) : null}
      <ThemedText type="subtitle" style={styles.chipBig} color={on ? Colors.onPrimary : Colors.text}>
        {bottom}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  panel: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chips: { gap: Spacing.two },
  chip: {
    minWidth: 56,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipBig: { fontSize: 17, lineHeight: 22 },
  minutes: { flexDirection: 'row', gap: Spacing.two },
  minute: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
