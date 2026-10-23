import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type { BookingDriver } from '@/api/types';
import { useI18n } from '@/i18n';

/** Assigned driver: initials avatar, name, the car's plate and a call button. */
export function DriverRow({
  driver,
  plate,
  trailing,
  callable = false,
}: {
  driver: BookingDriver | null | undefined;
  plate: string;
  trailing?: React.ReactNode;
  callable?: boolean;
}) {
  const { t } = useI18n();
  const name = driver?.displayName?.trim() || t('driverRow.fallbackName');
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <ThemedText style={styles.initials}>{initials}</ThemedText>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText type="caption" numberOfLines={1}>
          {t('driverRow.drivingYourCar', { plate })}
        </ThemedText>
      </View>
      {callable && driver?.phone ? (
        <Pressable
          onPress={() => void Linking.openURL(`tel:${driver.phone}`)}
          accessibilityRole="button"
          accessibilityLabel={t('driverRow.callA11y', { name })}
          hitSlop={8}
          style={({ pressed }) => [styles.call, pressed && { backgroundColor: Colors.primaryTint }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
              stroke={Colors.primary}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.primary },
  name: { fontSize: 16, lineHeight: 21 },
  call: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
