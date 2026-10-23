import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { BrandMark, Wordmark } from '@/components/brand/mark';
import { CityRouteScene, DayNightScene, TrustScene } from '@/components/onboarding/stages';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLayout } from '@/hooks/use-layout';
import { useI18n } from '@/i18n';
import { useSession } from '@/store/session';

/** Page 0 is the brand page (logo + motto); the rest are illustrated. */
const PAGES = [
  { key: 'brand' },
  { key: 'route', scene: <CityRouteScene />, text: 'onboarding.route' },
  { key: 'day-night', scene: <DayNightScene />, text: 'onboarding.dayNight' },
  { key: 'trust', scene: <TrustScene />, text: 'onboarding.trust' },
] as const;

export default function OnboardingScreen() {
  const { completeOnboarding } = useSession();
  const { t } = useI18n();
  const { gutter, short } = useLayout();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const busy = useRef(false);

  // onLayout reports `inner`'s border box; the pager only sees the area inside its padding
  const pageWidth = Math.max(0, width - gutter * 2);

  const goTo = useCallback(
    (next: number) => {
      if (busy.current) return;
      busy.current = true;
      setTimeout(() => (busy.current = false), 420);
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
    },
    [pageWidth],
  );

  const finish = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    await completeOnboarding();
    router.replace('/role');
  }, [completeOnboarding]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
  };

  const last = page === PAGES.length - 1;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View
        style={[styles.inner, { paddingHorizontal: gutter }]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.topRow}>
          <Indicator scrollX={scrollX} width={pageWidth || 1} label={t('onboarding.progressA11y')} />
          <View style={styles.topActions}>
            <LanguageSwitcher compact />
            {!last ? (
              <ThemedText
                type="small"
                style={styles.skip}
                role="button"
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.skipA11y')}
                onPress={finish}>
                {t('common.skip')}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
            style={styles.pager}>
            {PAGES.map((p) => (
              <ScrollView
                key={p.key}
                style={{ width: pageWidth }}
                contentContainerStyle={[styles.pageContent, { gap: short ? Spacing.three : Spacing.four }]}
                showsVerticalScrollIndicator={false}>
                {p.key === 'brand' ? (
                  <BrandPage compact={short} />
                ) : (
                  <>
                    {p.scene}
                    <View style={styles.text}>
                      <ThemedText type="title" maxFontSizeMultiplier={1.2} style={styles.headline}>
                        {t(`${p.text}.title`)}
                      </ThemedText>
                      <ThemedText type="body" color={Colors.textDim} style={styles.copy}>
                        {t(`${p.text}.copy`)}
                      </ThemedText>
                    </View>
                  </>
                )}
              </ScrollView>
            ))}
          </ScrollView>
        )}

        <View style={styles.bottomRow}>
          {page > 0 ? (
            <Button
              title={t('common.back')}
              variant="secondary"
              style={styles.backBtn}
              onPress={() => goTo(page - 1)}
            />
          ) : null}
          <Button
            title={last ? t('common.getStarted') : t('common.next')}
            onPress={last ? finish : () => goTo(page + 1)}
            accessoryRight={<ChevronRight />}
            style={styles.cta}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/** Logo on a soft halo, the wordmark, then the motto. */
function BrandPage({ compact }: { compact: boolean }) {
  const { t } = useI18n();
  const mark = compact ? 104 : 128;
  return (
    <View style={styles.brand} accessible accessibilityLabel={t('brand.a11y')}>
      <View style={[styles.halo, { width: mark * 2, height: mark * 2, borderRadius: mark }]}>
        <View style={[styles.haloInner, { width: mark * 1.5, height: mark * 1.5, borderRadius: mark * 0.75 }]}>
          <BrandMark size={mark} />
        </View>
      </View>
      <Wordmark size={compact ? 24 : 28} style={styles.wordmark} />
      <ThemedText type="display" maxFontSizeMultiplier={1.2} style={styles.motto}>
        {t('brand.motto')}
      </ThemedText>
      <ThemedText type="overline" style={styles.center}>
        {t('brand.tagline')}
      </ThemedText>
    </View>
  );
}

/** One pill per page; the active one stretches and turns green as pages change. */
function Indicator({ scrollX, width, label }: { scrollX: SharedValue<number>; width: number; label: string }) {
  return (
    <View style={styles.dotsTrack} accessibilityLabel={label}>
      {PAGES.map((p, i) => (
        <ProgressDot key={p.key} index={i} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
}

function ProgressDot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = scrollX.value / width;
    const active = Math.max(0, 1 - Math.abs(t - index));
    return {
      width: 8 + 18 * active,
      backgroundColor: interpolateColor(active, [0, 1], [Colors.borderStrong, Colors.primary]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  dotsTrack: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 8 },
  dot: { height: 8, borderRadius: 4, backgroundColor: Colors.borderStrong },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  skip: { color: Colors.textDim, fontSize: 15, paddingVertical: Spacing.two, paddingLeft: Spacing.three },
  pager: { flex: 1 },
  pageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  text: { gap: Spacing.two },
  brand: { alignItems: 'center', gap: Spacing.three },
  halo: { backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  haloInner: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  wordmark: { marginLeft: 8 },
  motto: { textAlign: 'center' },
  center: { textAlign: 'center' },
  headline: { fontSize: 32, lineHeight: 38 },
  copy: { maxWidth: 420 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  backBtn: { flex: 1 },
  cta: { flex: 2 },
});
