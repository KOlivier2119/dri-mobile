import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

/** Oversized geometric line icons drawn with views — no icon font. */

export function MoonIcon({ size = 30, color = Colors.mint }: { size?: number; color?: string }) {
  const cut = size * 0.42;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size * 0.11,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.inkSurfaceHi,
          transform: [{ translateX: size * 0.34 }, { translateY: -size * 0.24 }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: cut * 0.28,
          height: cut * 0.28,
          borderRadius: cut,
          backgroundColor: color,
          top: size * 0.08,
          right: -size * 0.06,
        }}
      />
    </View>
  );
}

export function WheelIcon({ size = 30, color = Colors.mint }: { size?: number; color?: string }) {
  const spoke = size * 0.1;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size * 0.1,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size / 2 - spoke / 2,
          top: size * 0.12,
          bottom: size * 0.12,
          width: spoke,
          backgroundColor: color,
          borderRadius: spoke,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size / 2 - spoke / 2,
          left: size * 0.12,
          right: size * 0.5,
          height: spoke,
          backgroundColor: color,
          borderRadius: spoke,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size / 2 - spoke / 2,
          right: size * 0.12,
          left: size * 0.5,
          height: spoke,
          backgroundColor: color,
          borderRadius: spoke,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size / 2 - size * 0.14,
          top: size / 2 - size * 0.14,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function PinIcon({ size = 22, color = Colors.mint }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size * 1.3 }} accessibilityElementsHidden>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size * 0.13,
          borderColor: color,
        }}
      />
      <View
        style={{
          alignSelf: 'center',
          width: size * 0.42,
          height: size * 0.42,
          borderTopLeftRadius: size * 0.42,
          borderTopRightRadius: size * 0.42,
          borderBottomRightRadius: size * 0.06,
          transform: [{ rotate: '45deg' }],
          backgroundColor: color,
          marginTop: -size * 0.12,
        }}
      />
    </View>
  );
}

export function Chip({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.chip}>
      {icon}
      <ThemedText type="small" color={Colors.warmDim} style={styles.chipText}>
        {label}
      </ThemedText>
    </View>
  );
}

/** Small honest tag: these compositions preview the product, not live services. */
export function PreviewTag({ style }: { style?: object }) {
  return (
    <View style={[styles.previewTag, style as object]}>
      <ThemedText style={styles.previewText}>DEMO PREVIEW</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.inkSurfaceHi,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12 },
  previewTag: {
    backgroundColor: Colors.mintSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  previewText: {
    fontFamily: Fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.mint,
  },
});
