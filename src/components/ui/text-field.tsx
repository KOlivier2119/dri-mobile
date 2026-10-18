import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  helper?: string;
  /** Rendered at the left edge inside the field (e.g. country code). */
  prefix?: React.ReactNode;
  /** Right-aligned fixed text (e.g. extension). */
  suffix?: React.ReactNode;
  containerStyle?: object;
};

export function TextField({
  label,
  error,
  helper,
  prefix,
  suffix,
  containerStyle,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? Colors.danger : focused ? Colors.mint : Colors.inkBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.field, { borderColor }, focused && styles.fieldRaised]}>
        {prefix}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={Colors.warmFaint}
          selectionColor={Colors.mint}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {suffix}
      </View>
      {error ? (
        <ThemedText type="small" color={Colors.danger} style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : helper ? (
        <ThemedText type="small" color={Colors.warmFaint} style={styles.error}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.medium,
    marginLeft: Spacing.two,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.inkSurface,
    borderWidth: 1.5,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three,
  },
  fieldRaised: {
    backgroundColor: Colors.inkSurfaceHi,
  },
  input: {
    flex: 1,
    minHeight: 54,
    fontFamily: Fonts.regular,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.warm,
    paddingVertical: Spacing.three,
  },
  error: {
    marginLeft: Spacing.two,
  },
});
