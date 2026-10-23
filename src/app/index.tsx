import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { canWork, feePaid, portalOf, useSession } from '@/store/session';

/**
 * Session gate. Every decision here reads server state (`/onboarding/state`,
 * the registration fee) — the client never infers a role:
 *  - customer: account → map → request (the car is added in the request form)
 *  - driver: account → application → documents → fee → admin review → (only then) work
 */
export default function Index() {
  const { session } = useSession();

  if (!session.hydrated || (session.user && !session.state)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!session.onboarded) return <Redirect href="/onboarding" />;
  if (!session.user) {
    if (session.pendingEmail) return <Redirect href="/auth/verify" />;
    // always ask rider-or-driver before signing up or in; a remembered choice is only pre-selected
    return <Redirect href="/role" />;
  }

  const driver = session.state!.driver;
  if (portalOf(session) === 'driver') {
    if (canWork(session)) return <Redirect href="/driver/home" />;
    if (!driver.applicationStatus || driver.missingDocs.length > 0) return <Redirect href="/driver/apply" />;
    if (driver.applicationStatus === 'SUBMITTED' && !feePaid(session)) return <Redirect href="/driver/fee" />;
    return <Redirect href="/driver/status" />;
  }

  return <Redirect href="/customer/home" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
});
