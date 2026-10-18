import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { MoonIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { DemoAccountRow } from '@/components/demo-account-row';

type Service = 'night' | 'day';

export default function ClientHome() {
  const [service, setService] = useState<Service>('night');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <ThemedText type="overline">DRI · Kigali</ThemedText>
            <ThemedText type="title" style={styles.greeting}>
              Good evening.
            </ThemedText>
          </View>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>M</ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">Where to tonight?</ThemedText>
          <ThemedText type="label" style={styles.fieldLabel}>
            PICK-UP
          </ThemedText>
          <View style={styles.fakeField}>
            <View style={styles.dotLive} />
            <ThemedText color={Colors.warmFaint}>Search a place…</ThemedText>
          </View>

          <View style={styles.services}>
            <ServiceTile
              active={service === 'night'}
              onPress={() => setService('night')}
              icon={
                <MoonIcon size={30} color={service === 'night' ? Colors.ink : Colors.warm} />
              }
              invertActive
              title="BOB Night"
              copy="Designated driver, your car"
            />
            <ServiceTile
              active={service === 'day'}
              onPress={() => setService('day')}
              icon={<WheelIcon size={30} color={service === 'day' ? Colors.ink : Colors.warm} />}
              invertActive
              title="Private Driver"
              copy="Hours or a full day"
            />
          </View>

          <Button
            title={service === 'night' ? 'Request a night driver' : 'Book a private driver'}
            accessoryRight={<ChevronRight />}
          />
          <ThemedText type="small" color={Colors.warmFaint} style={styles.mockNote}>
            UI prototype — booking is not connected to a live service.
          </ThemedText>
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripTop}>
            <ThemedText type="overline" style={{ color: Colors.warm }}>
              Your driver, Thursday
            </ThemedText>
            <ThemedText type="small" color={Colors.warmDim}>
              21:40 · Kacyiru → Nyutahye
            </ThemedText>
          </View>
          <View style={styles.tripRow}>
            <View style={styles.tripAvatar}>
              <ThemedText style={styles.avatarText}>JE</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={{ fontSize: 16, lineHeight: 21 }}>
                Jean E. · 4.9
              </ThemedText>
              <ThemedText type="small" color={Colors.warmDim}>
                Toyota RAV4 · RAD 123 A
              </ThemedText>
            </View>
            <View style={styles.callBtn}>
              <View style={styles.callGlyph} />
            </View>
          </View>
          <View style={styles.tripTrack}>
            <View style={styles.tripFill} />
          </View>
        </View>

        <DemoAccountRow />
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceTile({
  active,
  onPress,
  icon,
  title,
  copy,
  invertActive,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  copy: string;
  invertActive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${copy}`}
      style={({ pressed }) => [
        styles.tile,
        active && styles.tileActive,
        pressed && { opacity: 0.92 },
      ]}>
      <View style={[styles.tileIcon, active && invertActive && styles.tileIconActive]}>
        {icon}
      </View>
      <ThemedText type="subtitle" style={{ fontSize: 15, lineHeight: 20 }}>
        {title}
      </ThemedText>
      <ThemedText type="small" color={Colors.warmDim} style={{ fontSize: 12, lineHeight: 16 }}>
        {copy}
      </ThemedText>
    </Pressable>
  );
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inkSurfaceHi,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.mint },
  card: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.four,
  },
  fieldLabel: { marginTop: Spacing.one },
  fakeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.ink,
    paddingHorizontal: Spacing.three,
  },
  dotLive: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.mint },
  services: { flexDirection: 'row', gap: Spacing.three },
  tile: {
    flex: 1,
    gap: Spacing.two,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.ink,
    padding: Spacing.three,
  },
  tileActive: { borderColor: Colors.mint, backgroundColor: Colors.mintSoft },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.inkSurfaceHi,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  tileIconActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  mockNote: { textAlign: 'center' },
  tripCard: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.emeraldDeep,
    padding: Spacing.four,
  },
  tripTop: { gap: 2 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  tripAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(246,243,236,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callGlyph: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: Colors.ink,
    transform: [{ rotate: '-30deg' }],
  },
  tripTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(17,23,19,0.35)',
    overflow: 'hidden',
  },
  tripFill: { width: '38%', height: 5, borderRadius: 3, backgroundColor: Colors.mint },
});
