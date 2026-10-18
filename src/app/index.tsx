import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSession } from '@/store/session';

/** Session gate — pure demo state, not a real authenticated session. */
export default function Index() {
  const { session } = useSession();

  if (!session.hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.mint} />
      </View>
    );
  }

  if (!session.onboarded) return <Redirect href="/onboarding" />;
  if (!session.role) return <Redirect href="/role" />;
  if (!session.authed) return <Redirect href="/auth/phone" />;
  if (session.role === 'driver' && session.driverStatus === 'unsubmitted') {
    return <Redirect href="/driver/apply" />;
  }
  return <Redirect href={session.role === 'driver' ? '/driver/home' : '/client/home'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
});
