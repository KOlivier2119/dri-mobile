import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

/** Two-up selectable service tile used on the home and quote screens. */
export function ServiceTile({
  active,
  onPress,
  icon,
  title,
  copy,
}: {
  active: boolean;
  onPress: () => void;
  /** receives the icon colour for the current selection state */
  icon: (color: string) => React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${copy}`}
      style={({ pressed }) => [
        styles.tile,
        active && styles.tileActive,
        pressed && !active && { backgroundColor: Colors.surfaceAlt },
      ]}>
      <View style={[styles.tileIcon, active && styles.tileIconActive]}>
        {icon(active ? Colors.onPrimary : Colors.primary)}
      </View>
      <View style={{ gap: 2 }}>
        <ThemedText type="subtitle" numberOfLines={2} style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="label">{copy}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.three,
    borderRadius: Radius.field + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
  },
  tileActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconActive: { backgroundColor: Colors.primary },
  title: { fontSize: 15, lineHeight: 20 },
});
