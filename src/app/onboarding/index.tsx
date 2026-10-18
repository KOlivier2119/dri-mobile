import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { ConfidenceStage, RouteMapStage, ServiceSheetStage } from '@/components/onboarding/stages';
import { MoonIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { useSession } from '@/store/session';

const PAGES = 3;

export default function OnboardingScreen() {
  const { completeOnboarding } = useSession();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const busy = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      if (busy.current) return;
      busy.current = true;
      setTimeout(() => (busy.current = false), 420);
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    },
    [width],
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View
        style={styles.inner}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.topRow}>
          <Indicator scrollX={scrollX} width={width || 1} />
          <ThemedText
            type="subtitle"
            style={styles.skip}
            role="button"
            accessibilityRole="button"
            accessibilityLabel="Skip intro"
            onPress={finish}>
            Skip
          </ThemedText>
        </View>

        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.pager}>
            <Page width={width}>
              <RouteMapStage />
              <ThemedText type="overline" style={styles.eyebrow}>
                Designed driver service
              </ThemedText>
              <ThemedText type="title" style={styles.headline}>
                Your car.{'\n'}Your driver.
              </ThemedText>
              <ThemedText type="body" color={Colors.warmDim} style={styles.copy}>
                Get a trusted driver to take the wheel, while you enjoy the journey.
              </ThemedText>
            </Page>

            <Page width={width}>
              <ThemedText type="overline" style={styles.eyebrow}>
                BOB Night · Private Driver
              </ThemedText>
              <ThemedText type="title" style={styles.headline}>
                Your plans, handled.
              </ThemedText>
              <ThemedText type="body" color={Colors.warmDim} style={[styles.copy, styles.copyCenter]}>
                Book a driver for a night out, a few hours, or a day on your schedule.
              </ThemedText>
              <ServiceSheetStage />
            </Page>

            <Page width={width}>
              <ConfidenceStage />
              <ThemedText type="overline" style={styles.eyebrow}>
                Built for peace of mind
              </ThemedText>
              <ThemedText type="title" style={styles.headline}>
                Move with confidence.
              </ThemedText>
              <ThemedText type="body" color={Colors.warmDim} style={styles.copy}>
                Know who is driving, follow your trip, and keep the details close.
              </ThemedText>
            </Page>
          </ScrollView>
        )}

        <View style={styles.bottomRow}>
          {page > 0 ? (
            <Button
              title="Back"
              variant="secondary"
              size="md"
              style={styles.backBtn}
              onPress={() => goTo(page - 1)}
            />
          ) : (
            <View style={styles.roleHints}>
              <RoleHint icon={<MoonIcon size={16} color={Colors.warmDim} />} text="Night" />
              <RoleHint icon={<WheelIcon size={16} color={Colors.warmDim} />} text="Day" />
            </View>
          )}
          {page < PAGES - 1 ? (
            <Button
              title="Next"
              onPress={() => goTo(page + 1)}
              accessoryRight={<ChevronRight />}
              style={styles.cta}
            />
          ) : (
            <Button title="Get started" onPress={finish} accessoryRight={<ChevronRight />} style={styles.cta} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Page({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.page, { width }]}>{children}</View>
  );
}

function RoleHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.roleHint}>
      {icon}
      <ThemedText type="small" color={Colors.warmFaint}>
        {text}
      </ThemedText>
    </View>
  );
}

/** Three pills; the active one stretches and turns mint as pages change. */
function Indicator({
  scrollX,
  width,
}: {
  scrollX: SharedValue<number>;
  width: number;
}) {
  return (
    <View style={styles.dotsTrack} accessibilityLabel="Onboarding progress">
      {[0, 1, 2].map((i) => (
        <ProgressDot key={i} index={i} scrollX={scrollX} width={width} />
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
      width: 7 + 19 * active,
      backgroundColor: interpolateColor(active, [0, 1], [Colors.inkBorder, Colors.mint]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.ink },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingVertical: Spacing.two,
  },
  dotsTrack: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 8 },
  dot: { height: 7, borderRadius: 4, backgroundColor: Colors.inkBorder },
  skip: { color: Colors.warmDim, fontSize: 15 },
  pager: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  eyebrow: { textAlign: 'center' },
  headline: { fontSize: 34, lineHeight: 40, textAlign: 'center' },
  copy: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 340 },
  copyCenter: { marginBottom: Spacing.two },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  backBtn: { flex: 0.55 },
  cta: { flex: 1.45 },
  roleHints: {
    flex: 0.55,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  roleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
