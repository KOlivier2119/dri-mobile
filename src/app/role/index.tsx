import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Colors, Radius, ShadowLifted, Spacing } from '@/constants/theme';
import { Cars, Photos } from '@/constants/images';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { CheckIcon } from '@/components/onboarding/illustrations';
import { Photo, Scrim } from '@/components/ui/photo';
import { PressableScale } from '@/components/ui/pressable-scale';
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
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <ThemedText type="title">{t('role.title')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {t('role.subtitle')}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.choices} accessibilityRole="radiogroup">
        <Choice
          active={selected === 'customer'}
          onPress={() => setSelected('customer')}
          photo={Cars.corolla}
          title={t('role.riderTitle')}
          copy={t('role.riderCopy')}
          testID="role-customer"
        />
        <Choice
          active={selected === 'driver'}
          onPress={() => setSelected('driver')}
          photo={Photos.wheelWide}
          title={t('role.driverTitle')}
          copy={t('role.driverCopy')}
          testID="role-driver"
        />
      </Animated.View>

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
  photo,
  title,
  copy,
  testID,
}: {
  active: boolean;
  onPress: () => void;
  photo: number;
  title: string;
  copy: string;
  testID?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${copy}`}
      style={[styles.choice, active && styles.choiceActive]}
      testID={testID}>
      <View style={styles.photoBox}>
        <Photo source={photo} />
        <Scrim stops={[[0, 0], [0.6, 0], [1, 0.35]]} />
        {active ? (
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.check}>
            <CheckIcon size={16} color={Colors.onPrimary} strokeWidth={2.6} />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.choiceText}>
        <ThemedText type="subtitle" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="caption">{copy}</ThemedText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  signIn: { textAlign: 'center' },
  choices: { gap: Spacing.three },
  choice: {
    borderRadius: Radius.card + 4,
    borderWidth: 2,
    borderColor: Colors.surface,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...ShadowLifted,
  },
  choiceActive: { borderColor: Colors.primary },
  photoBox: { height: 132, backgroundColor: Colors.surfaceAlt },
  check: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { gap: 2, paddingHorizontal: Spacing.three, paddingTop: 14, paddingBottom: Spacing.three },
});
