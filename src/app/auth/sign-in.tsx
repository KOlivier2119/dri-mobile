import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/brand/mark';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { portalOf, useSession } from '@/store/session';
import { isValidEmail } from '@/utils/email';
import { useI18n } from '@/i18n';

export default function SignInScreen() {
  const { session, login } = useSession();
  const driver = portalOf(session) === 'driver';
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = touched && !isValidEmail(email) ? t('auth.invalid.email') : null;
  const passwordError = touched && !password ? t('auth.invalid.password') : null;

  const submit = async () => {
    setTouched(true);
    setError(null);
    if (busy || !isValidEmail(email) || !password) return;
    setBusy(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e, { 401: 'auth.invalid.credentials' }));
      setBusy(false);
    }
  };

  return (
    <Screen centered onBack={() => (router.canGoBack() ? router.back() : router.replace('/role'))}>
      <View style={styles.header}>
        <BrandMark size={48} />
        <ThemedText type="overline">{driver ? t('auth.portalDriver') : t('auth.portalRider')}</ThemedText>
        <ThemedText type="title">{t('auth.signIn.title')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {t('auth.signIn.subtitle')}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('auth.field.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder={t('auth.field.emailPlaceholder')}
          error={emailError}
        />
        <TextField
          label={t('auth.field.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          error={passwordError}
        />
        <ThemedText
          type="small"
          color={Colors.primary}
          style={styles.forgot}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/auth/reset', params: { email } })}>
          {t('auth.signIn.forgot')}
        </ThemedText>
        <FormError message={error} />
        <Button title={t('common.signIn')} loading={busy} onPress={() => void submit()} accessoryRight={<ChevronRight />} />
      </View>

      <ThemedText type="body" color={Colors.textDim} style={styles.center}>
        {driver ? t('auth.signIn.newDriver') : t('auth.signIn.newRider')}{' '}
        <ThemedText
          type="body"
          color={Colors.primary}
          accessibilityRole="button"
          onPress={() => router.replace('/auth/register')}>
          {driver ? t('auth.signIn.createDriver') : t('auth.signIn.createRider')}
        </ThemedText>
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  form: { gap: Spacing.three },
  forgot: { alignSelf: 'flex-end', paddingVertical: Spacing.one, marginTop: -Spacing.two },
  center: { textAlign: 'center' },
});
