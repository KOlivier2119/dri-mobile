import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { EyeIcon, EyeOffIcon } from '@/components/onboarding/illustrations';
import { useI18n } from '@/i18n';

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
  secureTextEntry,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  // password fields get a show/hide toggle; hidden by default
  const [revealed, setRevealed] = useState(false);
  const { t } = useI18n();
  const borderColor = error ? Colors.danger : focused ? Colors.primary : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.field, { borderColor }, focused && styles.fieldRaised]}>
        {prefix}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={Colors.textFaint}
          selectionColor={Colors.primary}
          {...inputProps}
          secureTextEntry={secureTextEntry && !revealed}
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
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('common.hidePassword') : t('common.showPassword')}
            hitSlop={10}
            style={styles.eye}>
            {revealed ? (
              <EyeOffIcon size={22} color={Colors.textDim} />
            ) : (
              <EyeIcon size={22} color={Colors.textDim} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText type="small" color={Colors.danger} style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : helper ? (
        <ThemedText type="small" color={Colors.textFaint} style={styles.error}>
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
    color: Colors.text,
    marginLeft: Spacing.one,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three,
  },
  fieldRaised: {
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 54,
    fontFamily: Fonts.regular,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.text,
    paddingVertical: Spacing.three,
  },
  eye: {
    width: 40,
    height: 40,
    marginRight: -Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginLeft: Spacing.one,
  },
});
