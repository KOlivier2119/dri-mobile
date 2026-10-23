import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { ServiceTile } from '@/components/ui/service-tile';
import { PlaceField, PlacePicker, type PickedPlace } from '@/components/place-picker';
import { WhenPicker, earliestSlot } from '@/components/when-picker';
import { CarPicker, carChoiceError, cleanPlate, type CarChoice } from '@/components/car-picker';
import { MoonIcon, WheelIcon } from '@/components/onboarding/illustrations';
import { ApiError } from '@/api/client';
import { Bookings, Quotes, Vehicles } from '@/api/endpoints';
import type { Quote, ServiceCode } from '@/api/types';
import { usePlaceName } from '@/hooks/use-place-name';
import { usePosition } from '@/hooks/use-position';
import { useRemote } from '@/hooks/use-remote';
import { useSession } from '@/store/session';
import { useI18n } from '@/i18n';

/**
 * The request form: route, service, departure time and the car. POST /quotes
 * prices the route server-side and pins it (~15 min); confirming creates the
 * booking from that quote — registering a newly typed plate first — and
 * starts (or schedules) the driver search.
 */
export default function RequestScreen() {
  const { session } = useSession();
  const { t, amount, departure, time } = useI18n();
  const params = useLocalSearchParams<{ service?: string; to?: string; toLat?: string; toLng?: string }>();
  const { position } = usePosition();
  const vehicles = useRemote(session.user ? Vehicles.list : null, [session.user?.id]);

  const [service, pickService] = useState<ServiceCode>(params.service === 'PRIVATE_DRIVER' ? 'PRIVATE_DRIVER' : 'BOB_NIGHT');
  const [chosenPickup, pickPickup] = useState<PickedPlace | null>(null);
  const [destination, pickDestination] = useState<PickedPlace | null>(
    params.to && params.toLat && params.toLng
      ? { name: params.to, lat: Number(params.toLat), lng: Number(params.toLng) }
      : null,
  );
  const [hours, pickHours] = useState(3);
  const [when, setWhen] = useState<Date | null>(null);
  const [chosenCar, setCar] = useState<CarChoice | null>(null);
  const [picking, setPicking] = useState<'pickup' | 'destination' | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // any change to what is priced invalidates the price
  const setService = (v: ServiceCode) => (pickService(v), setQuote(null));
  const setPickup = (v: PickedPlace) => (pickPickup(v), setQuote(null));
  const setDestination = (v: PickedPlace) => (pickDestination(v), setQuote(null));
  const setHours = (v: number) => (pickHours(v), setQuote(null));

  // pickup defaults to where the customer is standing
  const here = usePlaceName(position);
  const pickup = chosenPickup ?? (position && here.label ? { name: here.label, ...position } : null);
  // car defaults to the most recent one, or the plate form when there is none
  const car: CarChoice | null =
    chosenCar ??
    (vehicles.data
      ? vehicles.data[0]
        ? { kind: 'saved', id: vehicles.data[0].id }
        : { kind: 'new', plate: '', transmission: null }
      : null);

  if (!session.user) return <Redirect href="/" />;

  const carError = carChoiceError(car);

  const getPrice = async () => {
    setTouched(true);
    setError(null);
    if (!pickup || !destination || carError || busy) return;
    setBusy(true);
    try {
      setQuote(await Quotes.create(service, pickup, destination, hours));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  /** Saved car id, registering a new plate first (or reusing it if it already exists). */
  const resolveVehicleId = async (): Promise<string> => {
    if (car!.kind === 'saved') return car!.id;
    const plate = cleanPlate(car!.plate);
    try {
      const created = await Vehicles.create({ plate, transmission: car!.transmission! });
      return created.id;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const mine = (await Vehicles.list()).find((v) => v.plate === plate);
        if (mine) return mine.id;
      }
      throw e;
    }
  };

  const book = async () => {
    if (!quote || !pickup || busy) return;
    if (new Date(quote.expiresAt).getTime() < Date.now()) {
      setQuote(null);
      setError(t('request.expired'));
      return;
    }
    if (when && when.getTime() < earliestSlot().getTime()) {
      setError(t('request.tooSoon'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const vehicleId = await resolveVehicleId();
      const booking = await Bookings.create({
        quoteId: quote.id,
        vehicleId,
        pickupName: pickup.name,
        pickupLng: pickup.lng,
        pickupLat: pickup.lat,
        destinationName: destination?.name,
        destinationLng: destination?.lng,
        destinationLat: destination?.lat,
        startAt: when?.toISOString(),
        durationHours: service === 'PRIVATE_DRIVER' ? hours : undefined,
      });
      await Bookings.confirm(booking.id);
      router.replace({ pathname: '/customer/booking', params: { id: booking.id } });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      void vehicles.reload();
    }
  };

  return (
    <Screen
      onBack={true}
      footer={
        <View style={styles.footer}>
          {quote ? (
            <View style={styles.priceRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText type="caption" numberOfLines={1}>
                  {t(`services.${service}`)} · {departure(when)}
                </ThemedText>
                <ThemedText type="label">{t('request.fixedPrice')}</ThemedText>
              </View>
              <ThemedText type="subtitle">{amount(quote.amount)} RWF</ThemedText>
            </View>
          ) : null}
          <Button
            title={quote ? (when ? t('request.scheduleDriver') : t('request.requestDriver')) : t('request.seePrice')}
            loading={busy}
            onPress={() => void (quote ? book() : getPrice())}
            accessoryRight={<ChevronRight />}
            testID="request-confirm"
          />
        </View>
      }>
      <ThemedText type="title">{t('request.title')}</ThemedText>

      <View style={styles.route}>
        <PlaceField
          label={t('request.pickup')}
          value={pickup}
          placeholder={here.loading ? t('request.findingAddress') : t('request.pickupPlaceholder')}
          onPress={() => setPicking('pickup')}
          error={touched && !pickup ? t('request.pickupError') : null}
          dot={Colors.text}
        />
        <PlaceField
          label={t('request.destination')}
          value={destination}
          placeholder={t('request.destinationPlaceholder')}
          onPress={() => setPicking('destination')}
          error={touched && !destination ? t('request.destinationError') : null}
          dot={Colors.sun}
        />
      </View>

      <View style={styles.services} accessibilityRole="radiogroup">
        <ServiceTile
          active={service === 'BOB_NIGHT'}
          onPress={() => setService('BOB_NIGHT')}
          icon={(color) => <MoonIcon size={22} color={color} />}
          title={t('services.BOB_NIGHT')}
          copy={t('services.bobNightCopy')}
        />
        <ServiceTile
          active={service === 'PRIVATE_DRIVER'}
          onPress={() => setService('PRIVATE_DRIVER')}
          icon={(color) => <WheelIcon size={22} color={color} />}
          title={t('services.PRIVATE_DRIVER')}
          copy={t('services.privateDriverCopy')}
        />
      </View>

      {service === 'PRIVATE_DRIVER' ? (
        <View style={styles.hours}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small">{t('request.howLong')}</ThemedText>
            <ThemedText type="label">{t('request.hoursHelp')}</ThemedText>
          </View>
          <Stepper value={hours} min={1} max={24} onChange={setHours} suffix="h" />
        </View>
      ) : null}

      <WhenPicker value={when} onChange={setWhen} />

      <CarPicker vehicles={vehicles.data ?? []} value={car} onChange={setCar} showErrors={touched} />

      {quote ? (
        <View style={styles.quoteCard}>
          <ThemedText type="caption" numberOfLines={2}>
            {pickup?.name} → {destination?.name}
          </ThemedText>
          <ThemedText type="title" style={styles.amount}>
            {amount(quote.amount)} RWF
          </ThemedText>
          <ThemedText type="label">
            {t('request.priceHeld', { time: time(new Date(quote.expiresAt)) })}
          </ThemedText>
        </View>
      ) : null}

      <FormError message={error ?? vehicles.error} />

      <PlacePicker
        visible={picking !== null}
        title={picking === 'pickup' ? t('request.pickupPickerTitle') : t('request.destinationPickerTitle')}
        allowCurrentLocation={picking === 'pickup'}
        near={position ?? undefined}
        onClose={() => setPicking(null)}
        onPick={(place) => {
          if (picking === 'pickup') setPickup(place);
          else setDestination(place);
          setPicking(null);
        }}
      />
    </Screen>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.stepper}>
      <StepButton label="−" a11y={t('request.fewerHours')} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <ThemedText type="subtitle" style={styles.stepValue} accessibilityLiveRegion="polite">
        {value}
        {suffix}
      </ThemedText>
      <StepButton label="+" a11y={t('request.moreHours')} disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={6}
      style={({ pressed }) => [styles.step, pressed && { backgroundColor: Colors.primaryTint }, disabled && { opacity: 0.35 }]}>
      <ThemedText type="subtitle" color={Colors.primary} style={{ fontSize: 20, lineHeight: 22 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  route: { gap: Spacing.three },
  services: { flexDirection: 'row', gap: Spacing.two },
  hours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 44, textAlign: 'center', fontSize: 17 },
  quoteCard: {
    gap: Spacing.one,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.primaryTint,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    ...Shadow,
  },
  amount: { fontSize: 28, lineHeight: 34 },
  footer: { gap: Spacing.three },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
});
