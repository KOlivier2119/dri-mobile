import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { MomoSheet, isSettled } from '@/components/momo-sheet';
import { CheckIcon, PhoneIcon } from '@/components/onboarding/illustrations';
import { Drivers } from '@/api/endpoints';
import { feePaid, useSession } from '@/store/session';
import { useI18n } from '@/i18n';
import { formatLocal, normalizeDigits } from '@/utils/phone';

/** ADR-0028: the one-time fee must settle before an admin can review the application. */
const FEE_RWF = 5000;

export default function DriverFeeScreen() {
  const { session, refresh } = useSession();
  const { t, amount: money } = useI18n();
  const [payOpen, setPayOpen] = useState(false);

  if (!session.user) return <Redirect href="/" />;
  if (feePaid(session)) return <Redirect href="/" />;

  const amount = session.fee?.amount ?? FEE_RWF;
  const pending = session.fee && !isSettled(session.fee) && session.fee.status !== 'FAILED' ? session.fee : null;
  const phone = session.user.phone;

  return (
    <Screen
      centered
      footer={
        <Button
          title={pending ? t('fee.check') : t('fee.pay')}
          onPress={() => setPayOpen(true)}
          accessoryRight={<ChevronRight />}
          testID="fee-pay-open"
        />
      }>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        <View style={styles.badge}>
          <CheckIcon size={28} color={Colors.onPrimary} strokeWidth={2.4} />
        </View>
        <ThemedText type="title">{t('fee.title')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {t('fee.subtitle')}
        </ThemedText>
      </Animated.View>

      <View style={styles.card}>
        <View style={styles.feeRow}>
          <ThemedText type="caption">{t('fee.fee')}</ThemedText>
          <ThemedText type="subtitle">{money(amount)} RWF</ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.methodRow}>
          <View style={styles.momo}>
            <PhoneIcon size={18} color={Colors.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ThemedText type="small">{t('momo.provider')}</ThemedText>
            <ThemedText type="label" numberOfLines={1}>
              {pending
                ? t('fee.waiting')
                : phone
                  ? `+250 ${formatLocal(normalizeDigits(phone))}`
                  : t('fee.addNumber')}
            </ThemedText>
          </View>
        </View>
      </View>

      <MomoSheet
        visible={payOpen}
        title={t('fee.sheetTitle')}
        amount={amount}
        phone={phone}
        editablePhone
        existing={pending}
        start={(msisdn) => Drivers.payFee(msisdn)}
        poll={() => Drivers.fee()}
        onSettled={async () => {
          setPayOpen(false);
          await refresh().catch(() => {});
          router.replace('/');
        }}
        onClose={() => {
          setPayOpen(false);
          void refresh().catch(() => {});
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.two },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  card: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  divider: { height: 1, backgroundColor: Colors.border },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  momo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFCB05',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
