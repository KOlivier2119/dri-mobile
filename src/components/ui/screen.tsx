import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useI18n } from '@/i18n';

/**
 * Standard screen shell: safe areas, keyboard avoidance, a width-capped
 * scroll column with responsive gutters, an optional back row on top and an
 * optional pinned footer (for CTAs that must stay visible above long forms).
 */
export function Screen({
  children,
  centered = false,
  onBack,
  headerRight,
  header,
  footer,
  contentStyle,
}: {
  children: React.ReactNode;
  /** vertically centre short content (auth, status screens) */
  centered?: boolean;
  /** shows a back button; pass `true` to use router.back() */
  onBack?: true | (() => void);
  headerRight?: React.ReactNode;
  /** replaces the default back row entirely */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { gutter, short } = useLayout();
  const column = { paddingHorizontal: gutter };

  const back = onBack === true ? () => (router.canGoBack() ? router.back() : router.replace('/')) : onBack;
  const top =
    header ??
    (back || headerRight ? (
      <View style={[styles.column, styles.headerRow, column]}>
        {back ? <BackButton onPress={back} /> : <View />}
        {headerRight}
      </View>
    ) : null);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {top}
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[
            styles.column,
            styles.content,
            column,
            { paddingVertical: short ? Spacing.three : Spacing.four },
            centered && styles.centered,
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer ? <View style={[styles.column, styles.footer, column]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BackButton({ onPress, label }: { onPress: () => void; label?: string }) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label ?? t('common.back')}
      style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: Colors.surfaceAlt }]}>
      <View style={styles.backChevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  fill: { flex: 1, minHeight: 0 },
  column: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    minHeight: 48,
  },
  content: { flexGrow: 1, gap: Spacing.four },
  centered: { justifyContent: 'center' },
  footer: { paddingTop: Spacing.two, paddingBottom: Spacing.three },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.text,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
});
