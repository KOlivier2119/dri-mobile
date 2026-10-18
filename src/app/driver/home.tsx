import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { DemoAccountRow } from '@/components/demo-account-row';
import { useSession } from '@/store/session';

export default function DriverHome() {
  const { session } = useSession();
  const [online, setOnline] = useState(true);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <ThemedText type="overline">DRI · Driver</ThemedText>
            <ThemedText type="title" style={styles.greeting}>
              {online ? 'You are online' : 'You are offline'}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setOnline((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: online }}
            accessibilityLabel="Availability"
            style={[styles.switch, online ? styles.switchOn : styles.switchOff]}>
            <View style={[styles.knob, online && styles.knobOn]} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/driver/status')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.statusCard, pressed && { opacity: 0.9 }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="label">VERIFICATION</ThemedText>
            <ThemedText type="subtitle" style={{ fontSize: 17 }} accessibilityLiveRegion="polite">
              {labelFor(session.driverStatus)}
            </ThemedText>
            <ThemedText type="small" color={Colors.warmFaint}>
              Simulated state — tap to view or switch outcomes.
            </ThemedText>
          </View>
          <ChevronRight color={Colors.warmDim} />
        </Pressable>

        <View style={styles.earnRow}>
          <View style={styles.earnCard}>
            <ThemedText type="label">TODAY</ThemedText>
            <ThemedText type="title" style={styles.earnValue}>
              18,500
            </ThemedText>
            <ThemedText type="small" color={Colors.warmDim}>
              RWF · 4 trips (mock)
            </ThemedText>
          </View>
          <View style={styles.earnCard}>
            <ThemedText type="label">WEEK</ThemedText>
            <ThemedText type="title" style={styles.earnValue}>
              92,000
            </ThemedText>
            <ThemedText type="small" color={Colors.warmDim}>
              RWF · 21 trips (mock)
            </ThemedText>
          </View>
        </View>

        <View style={styles.request}>
          <View style={styles.requestPulse} />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="subtitle" style={{ fontSize: 17 }}>
              {online ? 'Listening for requests…' : 'Go online to receive requests'}
            </ThemedText>
            <ThemedText type="small" color={Colors.warmDim}>
              Demo mode — no live trip requests are sent.
            </ThemedText>
          </View>
        </View>

        <Button
          title="Simulate incoming trip"
          variant="secondary"
          disabled={!online}
          accessoryRight={<ChevronRight />}
        />

        <DemoAccountRow />
      </ScrollView>
    </SafeAreaView>
  );
}

function labelFor(status: string) {
  switch (status) {
    case 'approved':
      return 'Approved (demo)';
    case 'changes':
      return 'Needs more info';
    case 'rejected':
      return 'Not approved';
    case 'submitted':
      return 'Submitted';
    default:
      return 'Under review';
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.ink },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  greeting: { fontSize: 26, lineHeight: 32 },
  switch: {
    width: 64,
    height: 36,
    borderRadius: 18,
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: Colors.mint },
  switchOff: { backgroundColor: Colors.inkSurfaceHi, borderWidth: 1, borderColor: Colors.inkBorder },
  knob: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.ink,
  },
  knobOn: { alignSelf: 'flex-end' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.three,
  },
  earnRow: { flexDirection: 'row', gap: Spacing.three },
  earnCard: {
    flex: 1,
    gap: 2,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.three,
  },
  earnValue: { fontSize: 24, lineHeight: 30, color: Colors.mint },
  request: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.emerald,
    backgroundColor: Colors.mintSoft,
    padding: Spacing.three,
  },
  requestPulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.mint,
  },
  font: { fontFamily: Fonts.regular },
});
