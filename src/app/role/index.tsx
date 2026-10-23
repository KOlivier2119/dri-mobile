import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { CarIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/i18n';
import { useSession, type Journey } from '@/store/session';

export default function RoleScreen() {
  const { session, chooseJourney } = useSession();
  const { t } = useI18n();
  const [selected, setSelected] = useState<Journey | null>(session.journey);
  const [busy, setBusy] = useState(false);

  const cont = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      // portal intent only — this never grants a role
      await chooseJourney(selected);
      if (session.user) router.replace('/');
      else router.push('/auth/register');
    } finally {
      // the next screen is pushed on top, so this one stays mounted underneath;
      // reset or Continue is still disabled when the user comes back
      setBusy(false);
    }
  };

  return (
    <Screen
      centered
      headerRight={<LanguageSwitcher compact />}
      footer={
        <Button
          title={t('common.continue')}
          disabled={!selected}
          loading={busy}
          onPress={cont}
          accessoryRight={<ChevronRight />}
        />
      }>
      <View style={styles.header}>
        <ThemedText type="title">{t('role.title')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {t('role.subtitle')}
        </ThemedText>
      </View>

      <View style={styles.choices} accessibilityRole="radiogroup">
        <Choice
          active={selected === 'customer'}
          onPress={() => setSelected('customer')}
          icon={(color) => <CarIcon size={26} color={color} />}
          title={t('role.riderTitle')}
          copy={t('role.riderCopy')}
          testID="role-customer"
        />
        <Choice
          active={selected === 'driver'}
          onPress={() => setSelected('driver')}
          icon={(color) => <WheelIcon size={26} color={color} />}
          title={t('role.driverTitle')}
          copy={t('role.driverCopy')}
          testID="role-driver"
        />
      </View>

      {!session.user ? (
        <ThemedText type="body" color={Colors.textDim} style={styles.signIn}>
          {selected ? t('role.haveAccount') : t('role.chooseFirst')}
          <ThemedText
            type="body"
            color={selected ? Colors.primary : Colors.textFaint}
            accessibilityRole="button"
            accessibilityState={{ disabled: !selected }}
            onPress={
              selected
                ? async () => {
                    // the portal must be known before sign-in: a new driver is still a
                    // CUSTOMER on the server until their application is submitted
                    await chooseJourney(selected);
                    router.push('/auth/sign-in');
                  }
                : undefined
            }>
            {t('role.signInLink')}
          </ThemedText>
        </ThemedText>
      ) : null}
    </Screen>
  );
}

function Choice({
  active,
  onPress,
  icon,
  title,
  copy,
  testID,
}: {
  active: boolean;
  onPress: () => void;
  icon: (color: string) => React.ReactNode;
  title: string;
  copy: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${copy}`}
      style={({ pressed }) => [
        styles.choice,
        active && styles.choiceActive,
        pressed && !active && styles.choicePressed,
      ]}
      testID={testID}>
      <View style={[styles.iconBox, active && styles.iconBoxActive]}>
        {icon(active ? Colors.onPrimary : Colors.primary)}
      </View>
      <View style={styles.choiceText}>
        <ThemedText type="subtitle" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="caption">{copy}</ThemedText>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  signIn: { textAlign: 'center' },
  choices: { gap: Spacing.three },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  choiceActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  choicePressed: { backgroundColor: Colors.surfaceAlt },
  choiceText: { flex: 1, minWidth: 0, gap: 2 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxActive: { backgroundColor: Colors.primary },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
});
