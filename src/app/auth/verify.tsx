import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { OtpInput } from '@/components/ui/otp-input';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/store/session';
import { maskEmail } from '@/utils/email';
import { useI18n } from '@/i18n';

const RESEND_SECONDS = 30;

/** Second half of registration: the emailed code proves the mailbox and opens the session. */
export default function VerifyScreen() {
  const { session, verify, resendCode } = useSession();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ devCode?: string }>();
  const [devCode, setDevCode] = useState(params.devCode ?? null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = async (value = code) => {
    if (busy || value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verify(value);
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e, { 401: 'auth.invalid.wrongCode', 400: 'auth.invalid.wrongCode' }));
      setCode('');
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const sent = await resendCode();
      setSeconds(sent.retryAfterSeconds || RESEND_SECONDS);
      if (__DEV__ && sent.devCode) setDevCode(sent.devCode);
      setCode('');
      inputRef.current?.focus();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (session.user) return <Redirect href="/" />;
  if (!session.pendingEmail) return <Redirect href="/auth/register" />;

  return (
    <Screen centered onBack={() => router.replace('/auth/register')}>
      <View style={styles.header}>
        <ThemedText type="title">{t('auth.verify.title')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {t('auth.verify.subtitle')}{' '}
          <ThemedText type="body" style={styles.email}>
            {maskEmail(session.pendingEmail)}
          </ThemedText>
        </ThemedText>
      </View>

      <OtpInput
        ref={inputRef}
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(null);
        }}
        onComplete={(v) => void submit(v)}
        disabled={busy}
        error={!!error}
      />

      <FormError message={error} />

      <Button
        title={t('auth.verify.submit')}
        loading={busy}
        disabled={code.length !== 6 || busy}
        onPress={() => void submit()}
        accessoryRight={<ChevronRight />}
      />

      <View style={styles.footerRow}>
        <ThemedText
          type="small"
          color={seconds > 0 ? Colors.textFaint : Colors.primary}
          onPress={seconds > 0 ? undefined : () => void resend()}
          accessibilityRole="button"
          accessibilityLabel={seconds > 0 ? t('auth.verify.resendInA11y', { seconds }) : t('auth.verify.resend')}>
          {seconds > 0 ? t('auth.verify.resendIn', { seconds }) : t('auth.verify.resend')}
        </ThemedText>
        <ThemedText
          type="small"
          color={Colors.textDim}
          onPress={() => router.replace('/auth/register')}
          accessibilityRole="button">
          {t('auth.verify.differentEmail')}
        </ThemedText>
      </View>

      {devCode ? (
        <Pressable
          onPress={() => {
            setCode(devCode);
            void submit(devCode);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('auth.verify.devCodeA11y', { code: devCode.split('').join(' ') })}
          style={({ pressed }) => [styles.devCard, pressed && { backgroundColor: Colors.surfaceAlt }]}>
          <ThemedText type="label">{t('auth.verify.devCode')}</ThemedText>
          <ThemedText style={styles.devCode}>{devCode}</ThemedText>
          <ThemedText type="label" color={Colors.primary}>
            {t('common.tapToUse')}
          </ThemedText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  email: { fontFamily: Fonts.semibold },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.one },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  devCode: { fontFamily: Fonts.semibold, fontSize: 17, letterSpacing: 4, color: Colors.text },
});
