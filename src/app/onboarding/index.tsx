import { NavigationBar } from 'expo-navigation-bar';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { Photos } from '@/constants/images';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { Drift, Photo, Scrim } from '@/components/ui/photo';
import { BrandMark, Wordmark } from '@/components/brand/mark';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLayout } from '@/hooks/use-layout';
import { useI18n, type MessageKey } from '@/i18n';
import { useSession } from '@/store/session';

type Page = { key: string; photo: number; text?: 'onboarding.route' | 'onboarding.dayNight' | 'onboarding.trust' };

/** Page 0 is the brand page (logo + motto over Kigali at night); the rest tell the story. */
const PAGES: Page[] = [
  { key: 'brand', photo: Photos.kigaliNight },
  { key: 'route', photo: Photos.arrival, text: 'onboarding.route' },
  { key: 'day-night', photo: Photos.nightHighway, text: 'onboarding.dayNight' },
  { key: 'trust', photo: Photos.atTheWheel, text: 'onboarding.trust' },
];

/** Share of the screen width a photo slides while its page swipes past. */
const PARALLAX = 0.12;

/** How long each page shows before the intro moves on by itself. */
const PAGE_MS = 6000;

export default function OnboardingScreen() {
  const { completeOnboarding } = useSession();
  const { t } = useI18n();
  const { gutter, short } = useLayout();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  // plays through on its own until the user swipes or taps
  const [autoplay, setAutoplay] = useState(true);
  const scrollX = useSharedValue(0);
  const progress = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const finishing = useRef(false);

  const last = page === PAGES.length - 1;

  const goTo = useCallback(
    (next: number) => {
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    },
    [width],
  );

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (!autoplay || width === 0 || page === PAGES.length - 1) return;
    progress.value = withTiming(1, { duration: PAGE_MS, easing: Easing.linear });
    const timer = setTimeout(() => goTo(page + 1), PAGE_MS);
    return () => clearTimeout(timer);
  }, [autoplay, page, width, goTo, progress]);

  const takeOver = () => setAutoplay(false);

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    await completeOnboarding();
    router.replace('/role');
  }, [completeOnboarding]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.screen} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <StatusBar style="light" />
      <NavigationBar style="light" />
      {PAGES.map((p, i) => (
        <Backdrop key={p.key} index={i} photo={p.photo} scrollX={scrollX} width={width || 1} />
      ))}
      <Scrim
        stops={[
          [0, 0.55],
          [0.22, 0.1],
          [0.45, 0.2],
          [0.72, 0.82],
          [1, 0.97],
        ]}
      />

      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={[styles.topRow, { paddingHorizontal: gutter }]}>
          <Stories page={page} progress={progress} autoplay={autoplay} label={t('onboarding.progressA11y')} />
          <View style={styles.topActions}>
            <LanguageSwitcher compact onPhoto />
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
            onScrollBeginDrag={takeOver}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
            style={styles.fill}>
            {PAGES.map((p, i) => (
              <View key={p.key} style={[styles.page, { width, paddingHorizontal: gutter }]}>
                <View style={styles.pageInner}>
                  {i === page ? (
                    p.text ? (
                      <StoryText key={`${p.key}-${page}`} textKey={p.text} short={short} />
                    ) : (
                      <BrandPage key={`brand-${page}`} short={short} />
                    )
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={[styles.bottomRow, { paddingHorizontal: gutter }]}>
          {page > 0 ? (
            <Button
              title={t('common.back')}
              variant="glass"
              style={styles.backBtn}
              onPress={() => {
                takeOver();
                goTo(page - 1);
              }}
            />
          ) : null}
          <Button
            title={last ? t('common.getStarted') : t('common.next')}
            onPress={
              last
                ? finish
                : () => {
                    takeOver();
                    goTo(page + 1);
                  }
            }
            accessoryRight={<ChevronRight />}
            style={styles.cta}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

/** One full-screen photo per page, cross-fading with the swipe. */
function Backdrop({
  index,
  photo,
  scrollX,
  width,
}: {
  index: number;
  photo: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  // fades with the swipe and drifts at a fraction of its speed (parallax);
  // the photo is drawn wider than the screen so the drift never shows an edge
  const style = useAnimatedStyle(() => {
    const t = scrollX.value / width - index;
    return {
      opacity: interpolate(t, [-1, 0, 1], [0, 1, 0], 'clamp'),
      transform: [{ translateX: interpolate(t, [-1, 0, 1], [width * PARALLAX, 0, -width * PARALLAX], 'clamp') }],
    };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Drift>
        <Photo source={photo} priority="high" style={styles.backdropPhoto} />
      </Drift>
    </Animated.View>
  );
}

/** Logo, wordmark and motto, rising in one after the other. */
function BrandPage({ short }: { short: boolean }) {
  const { t } = useI18n();
  const mark = short ? 64 : 76;
  return (
    <View style={styles.brand} accessible accessibilityLabel={t('brand.a11y')}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.markRow}>
        <View style={[styles.markTile, { width: mark, height: mark, borderRadius: mark * 0.3 }]}>
          <BrandMark size={mark * 0.74} color={Colors.onPrimary} />
        </View>
        <Wordmark size={short ? 26 : 30} style={styles.wordmark} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(160).duration(650)}>
        <ThemedText type="display" maxFontSizeMultiplier={1.2} style={[styles.onPhoto, styles.motto]}>
          {t('brand.motto')}
        </ThemedText>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(420).duration(700)}>
        <ThemedText type="overline" style={styles.tagline}>
          {t('brand.tagline')}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

function StoryText({ textKey, short }: { textKey: NonNullable<Page['text']>; short: boolean }) {
  const { t } = useI18n();
  return (
    <View style={styles.text}>
      <Animated.View entering={FadeInDown.duration(550)}>
        <ThemedText
          type="display"
          maxFontSizeMultiplier={1.2}
          style={[styles.onPhoto, short ? styles.headlineShort : styles.headline]}>
          {t(`${textKey}.title` as MessageKey)}
        </ThemedText>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).duration(600)}>
        <ThemedText type="body" color={Colors.onNightDim} style={styles.copy}>
          {t(`${textKey}.copy` as MessageKey)}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

/** Story-style bars: finished pages full, the current one filling while it plays. */
function Stories({
  page,
  progress,
  autoplay,
  label,
}: {
  page: number;
  progress: SharedValue<number>;
  autoplay: boolean;
  label: string;
}) {
  return (
    <View style={styles.stories} accessibilityLabel={label} accessibilityValue={{ min: 1, max: PAGES.length, now: page + 1 }}>
      {PAGES.map((p, i) => (
        <StoryBar key={p.key} state={i < page ? 'done' : i > page ? 'todo' : autoplay ? 'playing' : 'done'} progress={progress} />
      ))}
    </View>
  );
}

function StoryBar({ state, progress }: { state: 'done' | 'todo' | 'playing'; progress: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({
    width: `${(state === 'done' ? 1 : state === 'todo' ? 0 : progress.value) * 100}%`,
  }));
  return (
    <View style={styles.bar}>
      <Animated.View style={[styles.barFill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.night, overflow: 'hidden' },
  backdropPhoto: { left: `-${PARALLAX * 100}%`, right: `-${PARALLAX * 100}%` },
  fill: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    minHeight: 48,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  stories: { flex: 1, flexDirection: 'row', gap: 5, maxWidth: 140 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2, backgroundColor: Colors.onNight },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  skip: { color: Colors.onNight, fontSize: 15, paddingVertical: Spacing.two, paddingLeft: Spacing.two },
  page: { flex: 1 },
  pageInner: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: Spacing.four,
  },
  brand: { gap: Spacing.three },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.two },
  markTile: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  wordmark: { color: Colors.onNight },
  onPhoto: { color: Colors.onNight },
  motto: { fontSize: 46, lineHeight: 50, letterSpacing: -1.4 },
  tagline: { color: Colors.primaryTint },
  text: { gap: Spacing.three },
  headline: { fontSize: 40, lineHeight: 44 },
  headlineShort: { fontSize: 34, lineHeight: 38 },
  copy: { maxWidth: 440, fontSize: 17, lineHeight: 26 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  backBtn: { flex: 1 },
  cta: { flex: 2 },
});
