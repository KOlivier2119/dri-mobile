import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { portalOf, useSession } from '@/store/session';
import { formatLocal, normalizeDigits } from '@/utils/phone';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/i18n';

/** Profile and sign-out. Riders and drivers each stay in their own portal. */
export default function AccountScreen() {
  const { session, signOut } = useSession();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  if (!session.user) return <Redirect href="/" />;

  const user = session.user;
  const name = user.displayName?.trim() || t('common.yourAccount');
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isDriverPortal = portalOf(session) === 'driver';

  const confirmSignOut = () => {
    const go = async () => {
      setBusy(true);
      await signOut();
      router.replace('/');
    };
    if (Platform.OS === 'web') return void go();
    Alert.alert(t('account.signOutConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.signOut'), style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <Screen onBack={true} footer={<Button title={t('common.signOut')} variant="secondary" loading={busy} onPress={confirmSignOut} />}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <ThemedText style={styles.initials}>{initials}</ThemedText>
        </View>
        <ThemedText type="title" style={styles.center}>
          {name}
        </ThemedText>
        <View style={styles.badge}>
          <ThemedText type="label" color={Colors.primary}>
            {isDriverPortal ? t('account.driver') : t('account.rider')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.card}>
        <Row label={t('account.email')} value={user.email} />
        <Row
          label={t('account.mobile')}
          value={user.phone ? `+250 ${formatLocal(normalizeDigits(user.phone))}` : t('account.notAdded')}
          last
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="label" style={styles.sectionLabel}>
          {t('language.label')}
        </ThemedText>
        <LanguageSwitcher />
      </View>
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <ThemedText type="label">{label}</ThemedText>
      <ThemedText type="body" numberOfLines={1} style={{ fontSize: 15 }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  initials: { fontFamily: Fonts.bold, fontSize: 28, lineHeight: 34, color: Colors.primary },
  center: { textAlign: 'center' },
  badge: { borderRadius: Radius.pill, backgroundColor: Colors.primarySoft, paddingHorizontal: 12, paddingVertical: 4 },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  section: { gap: Spacing.two },
  sectionLabel: { color: Colors.text, marginLeft: Spacing.one },
  row: { gap: 2, paddingHorizontal: Spacing.three, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
});
