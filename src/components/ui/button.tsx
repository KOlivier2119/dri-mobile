import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type Variant = 'primary' | 'secondary' | 'ghost';

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
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as object,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.ink : Colors.warm} />
      ) : (
        <View style={styles.content}>
          {icon}
          <ThemedText
            type="subtitle"
            style={[styles.label, variant === 'primary' && styles.labelPrimary]}>
            {title}
          </ThemedText>
          {accessoryRight}
        </View>
      )}
    </Pressable>
  );
}

/** Chevron / arrow used on the right edge of full-width CTAs. */
export function ChevronRight({ color = Colors.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        transform: [{ rotate: '45deg' }],
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        marginLeft: size * 0.15,
      }}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lg: {
    minHeight: 60,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: 22,
  },
  primary: {
    backgroundColor: Colors.mint,
  },
  secondary: {
    backgroundColor: Colors.inkSurfaceHi,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
  },
  labelPrimary: {
    color: Colors.ink,
  },
});
