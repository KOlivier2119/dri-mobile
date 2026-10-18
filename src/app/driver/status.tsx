import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { BrandMark } from '@/components/brand/mark';
import { useSession, type DriverStatus } from '@/store/session';

const STATES: Record<
  Exclude<DriverStatus, 'unsubmitted'>,
  { ring: string; mark: string; title: string; copy: string; next: string }
> = {
  submitted: {
    ring: Colors.warm,
    mark: '✓',
    title: 'Application submitted',
    copy: 'Your application is safely in the queue. Nothing more is needed from you right now.',
    next: 'What happens next: the demo moves it to “Under review”.',
  },
  review: {
    ring: Colors.mint,
    mark: '◔',
    title: 'Under review',
    copy: 'A demo reviewer is looking at your licence and documents. This normally takes a day.',
    next: 'What happens next: in the demo, use the state switch below to see each outcome.',
  },
  changes: {
    ring: Colors.danger,
    mark: '!',
    title: 'More information needed',
    copy: 'One item could not be read clearly in this demo. Re-open the application and re-attach the document.',
    next: 'What happens next: fix the flagged step and resubmit.',
  },
  approved: {
    ring: Colors.mint,
    mark: '✓',
    title: 'Approved for the demo',
    copy: 'In the real product a human verification team would have signed off here. In this prototype, approval is simulated.',
    next: 'What happens next: go online and receive demo trip requests.',
  },
  rejected: {
    ring: Colors.danger,
    mark: '×',
    title: 'Not approved',
    copy: 'This demo state shows what a rejection looks like. You may apply again after six months.',
    next: 'What happens next: review the requirements and reapply.',
  },
};

const ORDER: Exclude<DriverStatus, 'unsubmitted'>[] = ['submitted', 'review', 'changes', 'approved', 'rejected'];

export default function DriverStatusScreen() {
  const { session, setDriverStatus } = useSession();
  const status = session.driverStatus === 'unsubmitted' ? 'submitted' : session.driverStatus;
  const state = STATES[status];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
          <View style={[styles.ring, { borderColor: state.ring }]}>
            <ThemedText style={[styles.glyph, { color: state.ring }]} accessibilityLabel={state.title}>
              {state.mark}
            </ThemedText>
          </View>
          <ThemedText type="overline">Driver application</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {state.title}
          </ThemedText>
          <ThemedText type="body" color={Colors.warmDim} style={styles.copy}>
            {state.copy}
          </ThemedText>
          <ThemedText type="small" color={Colors.warmFaint}>
            {state.next}
          </ThemedText>
        </Animated.View>

        {status === 'approved' ? (
          <Button
            title="Open driver hub"
            onPress={() => router.replace('/driver/home')}
            accessoryRight={<ChevronRight />}
          />
        ) : status === 'changes' ? (
          <Button
            title="Fix application"
            variant="secondary"
            onPress={() => router.replace('/driver/apply')}
          />
        ) : (
          <Button
            title="Continue"
            variant="secondary"
            onPress={() => router.replace('/driver/home')}
          />
        )}

        <View style={styles.demoBox}>
          <ThemedText type="label">Demo control — simulated verification state</ThemedText>
          <View style={styles.stateRow}>
            {ORDER.map((s) => (
              <Pressable
                key={s}
                onPress={() => void setDriverStatus(s)}
                accessibilityRole="button"
                accessibilityState={{ selected: s === status }}
                accessibilityLabel={`Show state: ${s}`}
                style={[styles.stateChip, s === status && styles.stateChipOn]}>
                <ThemedText type="small" color={s === status ? Colors.ink : Colors.warmDim} style={{ textTransform: 'capitalize' }}>
                  {s === 'changes' ? 'needs info' : s}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.brandRow}>
            <BrandMark size={20} />
            <ThemedText type="small" color={Colors.warmFaint} style={{ flex: 1 }}>
              No real verification provider is involved — every state here is local demo data.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.ink },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.five,
  },
  hero: { alignItems: 'center', gap: Spacing.three, textAlign: 'center' },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  glyph: { fontSize: 34 },
  title: { fontSize: 28, lineHeight: 34, textAlign: 'center' },
  copy: { textAlign: 'center', maxWidth: 360 },
  demoBox: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.inkBorder,
    padding: Spacing.three,
  },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stateChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stateChipOn: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
