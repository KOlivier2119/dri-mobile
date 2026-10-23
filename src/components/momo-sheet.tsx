import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { CheckIcon, CloseIcon, PhoneIcon } from '@/components/onboarding/illustrations';
import type { Payment } from '@/api/types';
import { useI18n } from '@/i18n';
import { formatLocal, isCompleteLocalNumber, normalizeDigits, toE164 } from '@/utils/phone';

const POLL_MS = 3000;

type Phase = 'confirm' | 'requesting' | 'waiting' | 'paid' | 'failed';

export const isSettled = (p: Payment) => p.settlement === 'SETTLED' || p.paid === true;
const phaseOf = (p: Payment): Phase =>
  p.settlement === 'SETTLED' || p.paid === true ? 'paid' : p.status === 'FAILED' ? 'failed' : 'waiting';

/**
 * MTN MoMo "request to pay". The amount is decided by the server; `start`
 * opens the attempt (the customer then approves the prompt on their phone)
 * and `poll` re-reads it until it settles or fails. A payment that is
 * already in flight is passed as `existing` so reopening the sheet resumes it.
 */
export function MomoSheet({
  visible,
  title,
  amount,
  phone,
  editablePhone = false,
  existing,
  start,
  poll,
  onSettled,
  onClose,
}: {
  visible: boolean;
  title: string;
  amount: string | number;
  /** number that will be charged, E.164 */
  phone: string | null;
  /** let the person change the number (registration fee) */
  editablePhone?: boolean;
  existing?: Payment | null;
  start: (phone: string) => Promise<Payment>;
  poll: (payment: Payment) => Promise<Payment | null>;
  onSettled: () => Promise<void> | void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, amount: money } = useI18n();
  const { height } = useWindowDimensions();
  const [msisdn, setMsisdn] = useState(() => formatLocal(normalizeDigits(phone ?? '')));
  // local progress; until there is any, an attempt already with the provider is resumed
  const [local, setLocal] = useState<{ phase: Phase; payment: Payment | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const settledOnce = useRef(false);
  const payment = local ? local.payment : (existing ?? null);
  const phase: Phase = local ? local.phase : existing ? phaseOf(existing) : 'confirm';
  const setPhase = (next: Phase) => setLocal({ phase: next, payment });

  useEffect(() => {
    if (phase !== 'waiting' || !payment) return;
    const timer = setInterval(async () => {
      try {
        const next = await poll(payment);
        if (next) setLocal({ phase: phaseOf(next), payment: next });
      } catch {
        // transient — keep polling
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase, payment, poll]);

  useEffect(() => {
    if (phase !== 'paid' || settledOnce.current) return;
    settledOnce.current = true;
    const t = setTimeout(() => void onSettled(), 900);
    return () => clearTimeout(t);
  }, [phase, onSettled]);

  const invalid = editablePhone && !isCompleteLocalNumber(msisdn);
  const locked = phase === 'requesting';

  const pay = async () => {
    if (locked || invalid) return;
    setError(null);
    setPhase('requesting');
    try {
      const p = await start(editablePhone ? toE164(msisdn) : (phone ?? ''));
      setLocal({ phase: phaseOf(p), payment: p });
    } catch (e) {
      setError(errorMessage(e));
      setPhase('confirm');
    }
  };

  const close = () => {
    if (locked) return;
    setError(null);
    // drop local progress so reopening resumes from the latest `existing`
    if (phase !== 'paid') setLocal(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.scrimTouch} accessibilityLabel={t('momo.dismissA11y')} onPress={close}>
          <Pressable
            style={[styles.sheet, { maxHeight: height * 0.92, paddingBottom: insets.bottom + Spacing.four }]}
            onPress={(e) => e.stopPropagation()}>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.handle} />
              <View style={styles.headRow}>
                <View style={styles.momoBadge}>
                  <PhoneIcon size={20} color={Colors.text} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText type="subtitle" numberOfLines={2}>
                    {title}
                  </ThemedText>
                  <ThemedText type="label">{t('momo.provider')}</ThemedText>
                </View>
              </View>
              <View style={styles.amountRow}>
                <ThemedText type="display" style={styles.amount}>
                  {money(amount)}
                </ThemedText>
                <ThemedText type="subtitle" color={Colors.textDim}>
                  RWF
                </ThemedText>
              </View>

              {phase === 'paid' ? (
                <Status icon={<CheckIcon size={34} color={Colors.onPrimary} strokeWidth={2.4} />} tone={Colors.primary}>
                  {t('momo.received')}
                </Status>
              ) : phase === 'failed' ? (
                <>
                  <Status icon={<CloseIcon size={30} color={Colors.danger} strokeWidth={2.4} />} tone={Colors.dangerSoft}>
                    {t('momo.failed')}
                  </Status>
                  <Button title={t('common.tryAgain')} onPress={() => setPhase('confirm')} />
                </>
              ) : phase === 'waiting' ? (
                <View style={styles.waiting} accessibilityLiveRegion="polite">
                  <ActivityIndicator color={Colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="small">{t('momo.approve')}</ThemedText>
                    <ThemedText type="label">
                      {t('momo.approveHelp')}
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <>
                  {editablePhone ? (
                    <TextField
                      label={t('momo.numberLabel')}
                      value={msisdn}
                      onChangeText={(text) => {
                        const digits = normalizeDigits(text);
                        setMsisdn(digits === normalizeDigits(msisdn) ? text : formatLocal(digits));
                      }}
                      keyboardType="phone-pad"
                      editable={!locked}
                      prefix={<ThemedText style={styles.dial}>+250</ThemedText>}
                      error={invalid && msisdn ? t('momo.numberError') : null}
                    />
                  ) : (
                    <ThemedText type="caption">
                      {normalizeDigits(phone ?? '')
                        ? t('momo.requestTo', { phone: `+250 ${formatLocal(normalizeDigits(phone ?? ''))}` })
                        : t('momo.requestToAccount')}
                    </ThemedText>
                  )}
                  <FormError message={error} />
                  <Button
                    title={t('momo.pay', { amount: money(amount) })}
                    loading={locked}
                    disabled={invalid}
                    onPress={() => void pay()}
                    accessoryRight={<ChevronRight />}
                  />
                </>
              )}

              {phase !== 'paid' && !locked ? (
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel={phase === 'waiting' ? t('common.hide') : t('momo.cancelA11y')}
                  style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}>
                  <ThemedText type="small" color={Colors.textDim}>
                    {phase === 'waiting' ? t('common.hide') : t('common.cancel')}
                  </ThemedText>
                </Pressable>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Status({ icon, tone, children }: { icon: React.ReactNode; tone: string; children: string }) {
  return (
    <View style={styles.success} accessibilityLiveRegion="polite">
      <View style={[styles.successRing, { backgroundColor: tone }]}>{icon}</View>
      <ThemedText type="subtitle">{children}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: Colors.scrim, justifyContent: 'flex-end' },
  scrimTouch: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  sheetContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.two,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  momoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFCB05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  amount: { color: Colors.text },
  dial: { fontFamily: Fonts.medium, fontSize: 17, color: Colors.textDim },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    padding: Spacing.three,
  },
  success: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  successRing: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  cancel: { alignSelf: 'center', paddingVertical: Spacing.two },
});
