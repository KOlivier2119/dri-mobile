import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

/** `glass` is the translucent variant for use on photos and dark surfaces. */
type Variant = 'primary' | 'secondary' | 'ghost' | 'glass';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
  accessoryRight?: React.ReactNode;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'lg',
  icon,
  accessoryRight,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      hitSlop={8}
      onPress={(e) => {
        if (isDisabled) return;
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'lg' ? styles.lg : styles.md,
        pressed && !isDisabled && pressedStyle[variant],
        isDisabled && styles.disabled,
        style as object,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'glass' ? Colors.onPrimary : Colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon}
          <ThemedText
            type="subtitle"
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            style={[
              styles.label,
              size === 'md' && styles.labelMd,
              (variant === 'primary' || variant === 'glass') && styles.labelPrimary,
            ]}>
            {title}
          </ThemedText>
          {accessoryRight}
        </View>
      )}
    </Pressable>
  );
}

/** Chevron / arrow used on the right edge of full-width CTAs. */
export function ChevronRight({ color = Colors.onPrimary, size = 20 }: { color?: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: size * 0.5,
        height: size * 0.5,
        transform: [{ rotate: '-45deg' }],
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        marginLeft: -size * 0.1,
      }}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lg: {
    minHeight: 56,
  },
  md: {
    minHeight: 46,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  glass: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  pressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  pressedPrimary: {
    backgroundColor: Colors.primaryPressed,
  },
  pressedGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    maxWidth: '100%',
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
    flexShrink: 1,
  },
  labelMd: {
    fontSize: 15,
    lineHeight: 20,
  },
  labelPrimary: {
    color: Colors.onPrimary,
  },
});

const pressedStyle: Record<Variant, object> = {
  primary: styles.pressedPrimary,
  secondary: styles.pressed,
  ghost: styles.pressed,
  glass: styles.pressedGlass,
};
