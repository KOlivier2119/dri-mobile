import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

/** Two-to-four option toggle (e.g. gearbox). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.container}>
      <ThemedText type="label" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[styles.option, on && styles.optionOn]}>
              <ThemedText type="small" color={on ? Colors.text : Colors.textDim}>
                {o.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  label: { color: Colors.text, marginLeft: Spacing.one },
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: Radius.field,
    backgroundColor: Colors.surfaceAlt,
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.field - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionOn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
});
