import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/brand/mark';
import { useSession } from '@/store/session';

/** Demo-only account row: reset replays the fresh-install experience. */
export function DemoAccountRow() {
  const { session, resetDemo } = useSession();

  const reset = () => {
    const go = async () => {
      await resetDemo();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      void go();
      return;
    }
    Alert.alert('Reset demo data?', 'Clears local demo state and replays onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <BrandMark size={26} />
        <View style={{ flex: 1, gap: 1 }}>
          <ThemedText type="small">{session.phone ?? 'Guest'}</ThemedText>
          <ThemedText type="label" style={{ textTransform: 'capitalize' }}>
            {session.role === 'driver' ? 'Driver mode · demo session' : 'Client mode · demo session'}
          </ThemedText>
        </View>
      </View>
      <Pressable
        onPress={reset}
        accessibilityRole="button"
        accessibilityLabel="Reset demo data and replay onboarding"
        style={({ pressed }) => [styles.reset, pressed && { opacity: 0.7 }]}>
        <ThemedText type="small" color={Colors.danger}>
          Reset demo
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.three,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  reset: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
});
