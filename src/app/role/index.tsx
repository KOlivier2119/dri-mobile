import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { MoonIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { useSession, type Role } from '@/store/session';

export default function RoleScreen() {
  const { session, chooseRole } = useSession();
  const [selected, setSelected] = useState<Role | null>(session.role);
  const [busy, setBusy] = useState(false);

  const cont = async () => {
    if (!selected || busy) return;
    setBusy(true);
    await chooseRole(selected);
    router.push('/auth/phone');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ThemedText type="overline">One last thing</ThemedText>
        <ThemedText type="title" style={styles.headline}>
          How will you use DRI?
        </ThemedText>
        <ThemedText type="body" color={Colors.warmDim} style={styles.sub}>
          You can switch this later from your account.
        </ThemedText>

        <View style={styles.choices}>
          <Choice
            active={selected === 'client'}
            onPress={() => setSelected('client')}
            icon={<MoonIcon size={40} color={selected === 'client' ? Colors.ink : Colors.mint} />}
            iconMuted
            title="Book a driver"
            copy="You bring the car — a vetted DRI driver takes the wheel so you enjoy the ride."
            testID="role-client"
          />
          <Choice
            active={selected === 'driver'}
            onPress={() => setSelected('driver')}
            icon={<WheelIcon size={40} color={selected === 'driver' ? Colors.ink : Colors.warm} />}
            title="Drive with DRI"
            copy="Apply to drive with your own vehicle and set your own availability."
            testID="role-driver"
          />
        </View>

        <Button
          title="Continue"
          disabled={!selected}
          loading={busy}
          onPress={cont}
          accessoryRight={<ChevronRight />}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Choice({
  active,
  onPress,
  icon,
  iconMuted,
  title,
  copy,
  testID,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  iconMuted?: boolean;
  title: string;
  copy: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${copy}`}
      style={({ pressed }) => [
        styles.choice,
        active && styles.choiceActive,
        pressed && styles.choicePressed,
      ]}
      testID={testID}>
      <View style={[styles.iconBox, active && styles.iconBoxActive, iconMuted && active && styles.iconBoxMuted]}>
        {icon}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText type="body" color={Colors.warmDim} style={styles.choiceCopy}>
          {copy}
        </ThemedText>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioCheck} /> : null}
      </View>
    </Pressable>
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
    gap: Spacing.three,
  },
  headline: { fontSize: 32, lineHeight: 38 },
  sub: { marginBottom: Spacing.three },
  choices: { gap: Spacing.three },
  choice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.four,
    minHeight: 120,
  },
  choiceActive: {
    borderColor: Colors.mint,
    backgroundColor: Colors.mintSoft,
  },
  choicePressed: { opacity: 0.9 },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.inkSurfaceHi,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  iconBoxMuted: { backgroundColor: Colors.mint },
  choiceCopy: { fontSize: 14, lineHeight: 20 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.inkBorder,
    marginTop: 4,
  },
  radioActive: {
    borderColor: Colors.mint,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheck: {
    width: 10,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.ink,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  cta: { marginTop: Spacing.five },
});
