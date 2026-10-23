import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { CheckIcon, ClockIcon, CloseIcon } from '@/components/onboarding/illustrations';
import { useLiveRefresh } from '@/api/realtime';
import { canWork, useSession } from '@/store/session';
import { useI18n } from '@/i18n';

type Decision = 'pending' | 'approved' | 'rejected';

const TONE: Record<Decision, { bg: string; fg: string }> = {
  pending: { bg: Colors.sunSoft, fg: Colors.sun },
  approved: { bg: Colors.primary, fg: Colors.onPrimary },
  rejected: { bg: Colors.dangerSoft, fg: Colors.danger },
};

/**
 * Waiting room between submission and the DRIVER role. The decision is read
 * from /onboarding/state; nothing here can unlock the hub — only an admin's
 * approval on the server does.
 */
export default function DriverStatusScreen() {
  const { session, refresh } = useSession();
  const { t } = useI18n();
  const [checking, setChecking] = useState(false);

  useLiveRefresh({ events: [], onEvent: () => void refresh().catch(() => {}), pollMs: 30_000, enabled: Boolean(session.user) });

  if (!session.user || !session.state) return <Redirect href="/" />;

  const driver = session.state.driver;
  const decision: Decision = canWork(session)
    ? 'approved'
    : driver.applicationStatus === 'REJECTED'
      ? 'rejected'
      : 'pending';
  const tone = TONE[decision];
  const firstName = session.user.displayName?.split(' ')[0];

  const check = async () => {
    setChecking(true);
    await refresh().catch(() => {});
    setChecking(false);
  };

  return (
    <Screen
      centered
      footer={
        decision === 'approved' ? (
          <Button title={t('review.start')} onPress={() => router.replace('/driver/home')} accessoryRight={<ChevronRight />} />
        ) : decision === 'rejected' ? (
          <Button title={t('review.applyAgain')} onPress={() => router.replace('/driver/apply')} />
        ) : (
          <Button title={t('review.check')} variant="secondary" loading={checking} onPress={() => void check()} />
        )
      }>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        <View style={[styles.ring, { backgroundColor: tone.bg }]}>
          {decision === 'approved' ? (
            <CheckIcon size={36} color={tone.fg} strokeWidth={2.4} />
          ) : decision === 'rejected' ? (
            <CloseIcon size={34} color={tone.fg} strokeWidth={2.4} />
          ) : (
            <ClockIcon size={36} color={tone.fg} strokeWidth={2} />
          )}
        </View>
        <ThemedText type="title" style={styles.center}>
          {decision === 'approved' ? t('review.approved') : decision === 'rejected' ? t('review.rejected') : t('review.pending')}
        </ThemedText>
        <ThemedText type="body" color={Colors.textDim} style={[styles.center, styles.copy]}>
          {decision === 'approved'
            ? firstName
              ? t('review.approvedCopy', { name: firstName })
              : t('review.approvedCopyNoName')
            : decision === 'rejected'
              ? (driver.decisionReason ?? t('review.rejectedCopy'))
              : t('review.pendingCopy')}
        </ThemedText>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  center: { textAlign: 'center' },
  copy: { maxWidth: 380 },
});
