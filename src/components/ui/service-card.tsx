import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Colors, Fonts, Radius, ShadowLifted, Spacing } from '@/constants/theme';
import { Cars } from '@/constants/images';
import { ThemedText } from '@/components/themed-text';
import { Photo, Scrim } from '@/components/ui/photo';
import { PressableScale } from '@/components/ui/pressable-scale';
import { CheckIcon, MoonIcon, WheelIcon } from '@/components/onboarding/illustrations';
import type { ServiceCode } from '@/api/types';
import { useI18n } from '@/i18n';

const LOOK: Record<ServiceCode, { photo: number; night: boolean }> = {
  BOB_NIGHT: { photo: Cars.rav4, night: true },
  PRIVATE_DRIVER: { photo: Cars.corolla, night: false },
};

/** Two-up photo card for choosing a service (home and request screens). */
export function ServiceCards({
  value,
  onChange,
  compact = false,
}: {
  value: ServiceCode;
  onChange: (service: ServiceCode) => void;
  /** shorter cards for the request form */
  compact?: boolean;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {(['BOB_NIGHT', 'PRIVATE_DRIVER'] as const).map((code) => (
        <ServiceCard key={code} code={code} active={value === code} onPress={() => onChange(code)} compact={compact} />
      ))}
    </View>
  );
}

function ServiceCard({
  code,
  active,
  onPress,
  compact,
}: {
  code: ServiceCode;
  active: boolean;
  onPress: () => void;
  compact: boolean;
}) {
  const { t } = useI18n();
  const look = LOOK[code];
  const title = t(`services.${code}`);
  const copy = t(code === 'BOB_NIGHT' ? 'services.bobNightCopy' : 'services.privateDriverCopy');
  const tag = t(code === 'BOB_NIGHT' ? 'discover.bobNightTag' : 'discover.privateTag');

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${copy}`}
      style={[styles.card, active && styles.cardActive]}>
      <View style={[styles.photo, compact && styles.photoCompact]}>
        <Photo source={look.photo} />
        {/* BOB Night reads as night: a deep, cool wash over the photo */}
        <Scrim
          stops={
            look.night
              ? [
                  [0, 0.5],
                  [1, 0.55],
                ]
              : [
                  [0, 0.2],
                  [0.6, 0],
                  [1, 0],
                ]
          }
        />
        <View style={styles.top}>
          <View style={styles.tag}>
            {look.night ? <MoonIcon size={12} color={Colors.onNight} /> : <WheelIcon size={12} color={Colors.onNight} />}
            <ThemedText style={styles.tagText} numberOfLines={1}>
              {tag}
            </ThemedText>
          </View>
          {active ? (
            <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.check}>
              <CheckIcon size={14} color={Colors.onPrimary} strokeWidth={2.8} />
            </Animated.View>
          ) : (
            <View style={styles.ring} />
          )}
        </View>
      </View>
      <View style={styles.text}>
        <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
        {compact ? null : (
          <ThemedText type="label" color={Colors.onNightDim} numberOfLines={2}>
            {copy}
          </ThemedText>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two + 2 },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.night,
    borderWidth: 2,
    borderColor: 'transparent',
    ...ShadowLifted,
  },
  // the car photos are ~2:1; this keeps the whole car in frame
  photo: { aspectRatio: 1.7, backgroundColor: Colors.nightRaised },
  photoCompact: { aspectRatio: 2 },
  cardActive: { borderColor: Colors.primaryBright },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(13, 25, 20, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 1,
  },
  tagText: { fontFamily: Fonts.semibold, fontSize: 11, lineHeight: 14, color: Colors.onNight, letterSpacing: 0.3 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  text: { gap: 2, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  title: { color: Colors.onNight, fontSize: 16, lineHeight: 21 },
});
