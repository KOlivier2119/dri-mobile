import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { CarIcon } from '@/components/onboarding/illustrations';
import type { Transmission, Vehicle } from '@/api/types';
import { useI18n, type MessageKey } from '@/i18n';

export type CarChoice =
  | { kind: 'saved'; id: string }
  | { kind: 'new'; plate: string; transmission: Transmission | null };

export const cleanPlate = (plate: string) => plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

const plateValid = (plate: string) => /^[A-Z0-9]{4,12}$/.test(cleanPlate(plate));

/** Problem with the chosen car (a message key), or null when it can be booked. */
export function carChoiceError(choice: CarChoice | null): MessageKey | null {
  if (!choice) return 'car.needCar';
  if (choice.kind === 'saved') return null;
  if (!plateValid(choice.plate)) return 'car.plateError';
  if (!choice.transmission) return 'car.gearboxError';
  return null;
}

/** "Your car": pick a saved one by plate, or enter a new plate inline. */
export function CarPicker({
  vehicles,
  value,
  onChange,
  showErrors,
}: {
  vehicles: Vehicle[];
  value: CarChoice | null;
  onChange: (choice: CarChoice) => void;
  showErrors?: boolean;
}) {
  const { t } = useI18n();
  const adding = value?.kind === 'new';
  const draft = value?.kind === 'new' ? value : null;

  return (
    <View style={styles.container}>
      <ThemedText type="label" style={styles.label}>
        {t('car.label')}
      </ThemedText>

      {vehicles.length > 0 ? (
        <View style={styles.list} accessibilityRole="radiogroup">
          {vehicles.map((v) => {
            const on = value?.kind === 'saved' && value.id === v.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => onChange({ kind: 'saved', id: v.id })}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t('car.plateA11y', {
                  plate: v.plate,
                  car: [v.make, v.model].filter(Boolean).join(' ') || t('car.car'),
                })}
                style={[styles.car, on && styles.carOn]}>
                <CarIcon size={22} color={on ? Colors.primary : Colors.textDim} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <ThemedText style={styles.plate}>{v.plate}</ThemedText>
                  <ThemedText type="label" numberOfLines={1}>
                    {[v.make, v.model].filter(Boolean).join(' ') || t('car.car')} · {t(`transmission.${v.transmission}`)}
                  </ThemedText>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {adding ? (
        <View style={styles.newCar}>
          <TextField
            label={t('car.plate')}
            value={draft!.plate}
            onChangeText={(plate) => onChange({ ...draft!, plate: plate.toUpperCase().slice(0, 16) })}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="RAD 123 C"
            error={showErrors && !plateValid(draft!.plate) ? t('car.plateError') : null}
          />
          <Segmented
            label={t('car.gearbox')}
            value={draft!.transmission}
            onChange={(transmission) => onChange({ ...draft!, transmission })}
            options={[
              { value: 'AUTOMATIC', label: t('transmission.AUTOMATIC') },
              { value: 'MANUAL', label: t('transmission.MANUAL') },
            ]}
          />
          {showErrors && !draft!.transmission ? (
            <ThemedText type="small" color={Colors.danger} style={styles.label}>
              {t('car.gearboxError')}
            </ThemedText>
          ) : (
            <ThemedText type="label" style={styles.label}>
              {t('car.gearboxHelp')}
            </ThemedText>
          )}
          {vehicles.length > 0 ? (
            <ThemedText
              type="small"
              color={Colors.primary}
              accessibilityRole="button"
              onPress={() => onChange({ kind: 'saved', id: vehicles[0].id })}>
              {t('car.useSaved')}
            </ThemedText>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={() => onChange({ kind: 'new', plate: '', transmission: null })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.add, pressed && { backgroundColor: Colors.surfaceAlt }]}>
          <ThemedText type="small" color={Colors.primary}>
            {vehicles.length > 0 ? t('car.useAnother') : t('car.addPlate')}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  label: { color: Colors.text, marginLeft: Spacing.one },
  list: { gap: Spacing.two },
  car: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 60,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  carOn: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  plate: { fontFamily: Fonts.semibold, fontSize: 15, letterSpacing: 1.5, color: Colors.text },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  newCar: {
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
  },
  add: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
