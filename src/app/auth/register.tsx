import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { portalOf, useSession } from '@/store/session';
import { isValidEmail } from '@/utils/email';
import { formatLocal, isCompleteLocalNumber, normalizeDigits, toE164 } from '@/utils/phone';
import { useI18n } from '@/i18n';

/** Registration (ADR-0029): creates an unverified account and emails a 6-digit code. */
export default function RegisterScreen() {
  const { session, register } = useSession();
  const driver = portalOf(session) === 'driver';
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: name.trim().length < 2 ? t('auth.invalid.name') : null,
    email: !isValidEmail(email) ? t('auth.invalid.email') : null,
    phone: !isCompleteLocalNumber(phone) ? t('auth.invalid.phone') : null,
    password: password.length < 10 ? t('auth.invalid.passwordLength') : null,
  };
  const valid = Object.values(errors).every((e) => e === null);
  const show = (e: string | null) => (touched ? e : null);

  const submit = async () => {
    setTouched(true);
    setError(null);
    if (busy || !valid) return;
    setBusy(true);
    try {
      const sent = await register({ displayName: name.trim(), email, phone: toE164(phone), password });
      // a local mock-mail backend returns the code; never present in staging/production
      router.replace({ pathname: '/auth/verify', params: __DEV__ && sent.devCode ? { devCode: sent.devCode } : {} });
    } catch (e) {
      setError(errorMessage(e, { 409: 'auth.invalid.emailTaken' }));
      setBusy(false);
    }
  };

  return (
    <Screen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/role'))}
      footer={
        <Button title={t('auth.register.submit')} loading={busy} onPress={() => void submit()} accessoryRight={<ChevronRight />} />
      }>
      <View style={styles.header}>
        <ThemedText type="overline">{driver ? t('auth.portalDriver') : t('auth.portalRider')}</ThemedText>
        <ThemedText type="title">{driver ? t('auth.register.titleDriver') : t('auth.register.titleRider')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {driver ? t('auth.register.subtitleDriver') : t('auth.register.subtitleRider')}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label={driver ? t('auth.field.fullName') : t('auth.field.name')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          placeholder={t('auth.field.namePlaceholder')}
          error={show(errors.name)}
        />
        <TextField
          label={t('auth.field.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder={t('auth.field.emailPlaceholder')}
          error={show(errors.email)}
        />
        <TextField
          label={t('auth.field.mobile')}
          value={phone}
          onChangeText={(text) => {
            const digits = normalizeDigits(text);
            setPhone(digits === normalizeDigits(phone) ? text : formatLocal(digits));
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="78 123 4567"
          prefix={<ThemedText style={styles.dial}>+250</ThemedText>}
          helper={driver ? t('auth.field.mobileHelpDriver') : t('auth.field.mobileHelpRider')}
          error={show(errors.phone)}
        />
        <TextField
          label={t('auth.field.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          helper={t('auth.field.passwordHelp')}
          error={show(errors.password)}
        />
        <FormError message={error} />
        <ThemedText type="body" color={Colors.textDim} style={styles.legal}>
          {t('auth.register.already')}{' '}
          <ThemedText type="body" color={Colors.primary} accessibilityRole="button" onPress={() => router.replace('/auth/sign-in')}>
            {t('common.signIn')}
          </ThemedText>
        </ThemedText>
        <ThemedText type="label" style={styles.legal}>
          {t('auth.register.terms')}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  form: { gap: Spacing.three },
  dial: { fontFamily: Fonts.medium, fontSize: 17, color: Colors.textDim },
  legal: { textAlign: 'center' },
});
