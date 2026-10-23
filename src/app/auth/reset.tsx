import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Auth } from '@/api/endpoints';
import { useSession } from '@/store/session';
import { isValidEmail } from '@/utils/email';
import { useI18n } from '@/i18n';

/** Password reset: request an emailed code, then set a new password with it (signs in). */
export default function ResetScreen() {
  const { completeReset } = useSession();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const request = async () => {
    setError(null);
    if (!isValidEmail(email)) return setError(t('auth.invalid.email'));
    setBusy(true);
    try {
      const res = await Auth.requestReset(email.trim().toLowerCase());
      setSent(true);
      setInfo(__DEV__ && res.devCode ? t('auth.reset.devCode', { code: res.devCode }) : null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError(t('auth.invalid.code'));
    if (password.length < 10) return setError(t('auth.invalid.newPasswordLength'));
    setBusy(true);
    try {
      await completeReset(await Auth.confirmReset(email.trim().toLowerCase(), code, password));
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e, { 401: 'auth.invalid.wrongCode' }));
      setBusy(false);
    }
  };

  return (
    <Screen
      onBack={true}
      footer={
        <Button
          title={sent ? t('auth.reset.set') : t('auth.reset.send')}
          loading={busy}
          onPress={() => void (sent ? confirm() : request())}
          accessoryRight={<ChevronRight />}
        />
      }>
      <View style={styles.header}>
        <ThemedText type="title">{t('auth.reset.title')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {sent ? t('auth.reset.subtitleSent') : t('auth.reset.subtitle')}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('auth.field.email')}
          value={email}
          onChangeText={setEmail}
          editable={!sent}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {sent ? (
          <>
            <TextField
              label={t('auth.field.code')}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              helper={info ?? undefined}
            />
            <TextField
              label={t('auth.field.newPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              helper={t('auth.field.passwordHelp')}
            />
          </>
        ) : null}
        <FormError message={error} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  form: { gap: Spacing.three },
});
