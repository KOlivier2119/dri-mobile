import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { LOCALES, LOCALE_NAMES, useI18n, type Locale } from '@/i18n';

const SHORT: Record<Locale, string> = { rw: 'RW', en: 'EN', fr: 'FR' };

/**
 * Language choice. `compact` is the RW · EN · FR pill for the top of the intro
 * and sign-up screens; the full variant lists each language by its own name.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  if (compact) {
    return (
      <View style={styles.pill} accessibilityRole="radiogroup" accessibilityLabel={t('language.change')}>
        {LOCALES.map((l) => {
          const on = l === locale;
          return (
            <Pressable
              key={l}
              onPress={() => setLocale(l)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={LOCALE_NAMES[l]}
              hitSlop={4}
              style={[styles.pillOption, on && styles.pillOptionOn]}>
              <ThemedText style={[styles.pillText, on && styles.pillTextOn]}>{SHORT[l]}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel={t('language.label')}>
      {LOCALES.map((l, i) => {
        const on = l === locale;
        return (
          <Pressable
            key={l}
            onPress={() => setLocale(l)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && { backgroundColor: Colors.surfaceAlt }]}>
            {/* each language is named in itself, so it's findable whatever the current language */}
            <ThemedText type="body" style={{ flex: 1, fontSize: 15 }}>
              {LOCALE_NAMES[l]}
            </ThemedText>
            <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
  },
  pillOption: {
    minWidth: 36,
    minHeight: 30,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOptionOn: { backgroundColor: Colors.surface },
  pillText: { fontFamily: Fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: Colors.textDim },
  pillTextOn: { color: Colors.primary },
  list: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, minHeight: 52 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.border },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
