import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { DocUploadField } from '@/components/ui/doc-upload';
import { WheelIcon } from '@/components/onboarding/illustrations';
import { MOCK, mockDelay, useSession } from '@/store/session';
import { formatLocal, normalizeDigits } from '@/utils/phone';

type Form = {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  altPhone: string;
  city: string;
  nationalId: string;
  license: string;
  licenseExpiry: string;
  vehicle: string;
  plate: string;
  idDoc: boolean;
  licenseDoc: boolean;
  agree: boolean;
};

const EMPTY: Form = {
  firstName: '', lastName: '', dob: '',
  email: '', altPhone: '', city: '',
  nationalId: '',
  license: '', licenseExpiry: '', vehicle: '', plate: '',
  idDoc: false, licenseDoc: false, agree: false,
};

const STEPS = [
  {
    key: 'personal',
    title: 'Personal information',
    why: 'So drivers and clients know who is behind the wheel.',
  },
  {
    key: 'contact',
    title: 'Contact details',
    why: 'Where to reach you about trip requests.',
  },
  {
    key: 'identity',
    title: 'Identity information',
    why: 'Required by Rwandan transport rules for professional drivers.',
  },
  {
    key: 'license',
    title: 'Driving licence',
    why: 'We drive clients in their cars — the licence is the heart of the application.',
  },
  {
    key: 'documents',
    title: 'Documents',
    why: 'Photos of the originals. For this demo nothing is uploaded for real.',
  },
  { key: 'review', title: 'Review application', why: 'Check everything before sending.' },
];

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

/** Valid demo values so a tester can walk the whole flow quickly. */
const DEMO: Partial<Form> = {
  firstName: 'Jean',
  lastName: 'Mugisha',
  dob: '12.03.1995',
  email: 'jean.mugisha@example.com',
  altPhone: '78 999 1122',
  city: 'Kigali',
  nationalId: '1199580000000001',
  license: 'RWK1234567',
  licenseExpiry: '01.01.2030',
  vehicle: 'Toyota RAV4',
  plate: 'RAD 123 A',
  idDoc: true,
  licenseDoc: true,
  agree: true,
};

const STEP_KEYS: (keyof Form)[][] = [
  ['firstName', 'lastName', 'dob'],
  ['email', 'altPhone', 'city'],
  ['nationalId'],
  ['license', 'licenseExpiry', 'vehicle', 'plate'],
  ['idDoc', 'licenseDoc'],
  ['agree'],
];

export default function DriverApplyScreen() {
  const { setDriverStatus } = useSession();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const autofill = () => {
    const patch: Partial<Form> = {};
    for (const key of STEP_KEYS[step]) {
      if (DEMO[key] !== undefined) patch[key] = DEMO[key] as never;
    }
    setForm((f) => ({ ...f, ...patch }));
    setTouched(false);
  };

  const errors = validateStep(step, form);
  const valid = Object.keys(errors).length === 0;
  const last = step === STEPS.length - 1;

  const next = () => {
    setTouched(true);
    if (!valid) return;
    setTouched(false);
    if (last) return;
    setStep((s) => s + 1);
  };

  const back = () => {
    setTouched(false);
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    await mockDelay(MOCK.submitDelayMs);
    await setDriverStatus('review');
    router.replace('/driver/status');
  };

  const err = (k: keyof Form) => (touched ? errors[k] ?? null : null);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            onPress={back}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}>
            <View style={styles.backChevron} />
          </Pressable>
          <View style={{ flex: 1, gap: Spacing.two }}>
            <ThemedText type="label">
              Step {step + 1} of {STEPS.length} — {STEPS[step].title}
            </ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
            </View>
          </View>
          <WheelIcon size={26} color={Colors.mint} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            {STEPS[step].title}
          </ThemedText>
          <ThemedText type="body" color={Colors.warmDim} style={styles.why}>
            {STEPS[step].why}
          </ThemedText>

          <Pressable
            onPress={autofill}
            accessibilityRole="button"
            accessibilityLabel="Autofill demo data for this step"
            style={({ pressed }) => [styles.fillChip, pressed && { opacity: 0.7 }]}>
            <ThemedText type="small" color={Colors.mint}>
              Autofill demo data
            </ThemedText>
          </Pressable>

          {step === 0 && (
            <>
              <TextField label="First name" value={form.firstName} onChangeText={(v) => set('firstName', v)} autoCapitalize="words" autoComplete="given-name" error={err('firstName')} />
              <TextField label="Last name" value={form.lastName} onChangeText={(v) => set('lastName', v)} autoCapitalize="words" autoComplete="family-name" error={err('lastName')} />
              <TextField
                label="Date of birth"
                value={form.dob}
                onChangeText={(v) => {
                  const d = onlyDigits(v, 8);
                  set('dob', d.replace(/(\d{2})(\d{2})(\d{0,4})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join('.')));
                }}
                placeholder="DD.MM.YYYY"
                keyboardType="number-pad"
                error={err('dob')}
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextField label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err('email')} />
              <TextField
                label="Alternate phone"
                value={form.altPhone}
                onChangeText={(text) => {
                  const digits = normalizeDigits(text);
                  const current = normalizeDigits(form.altPhone);
                  set('altPhone', digits === current ? text : formatLocal(digits));
                }}
                keyboardType="phone-pad"
                helper="Optional — a number we can reach you on besides your login."
                error={err('altPhone')}
              />
              <TextField label="City" value={form.city} onChangeText={(v) => set('city', v)} autoCapitalize="words" error={err('city')} />
            </>
          )}

          {step === 2 && (
            <TextField
              label="National ID number"
              value={form.nationalId}
              onChangeText={(v) => set('nationalId', onlyDigits(v, 16))}
              keyboardType="number-pad"
              helper="16 digits, as printed on your ID."
              error={err('nationalId')}
            />
          )}

          {step === 3 && (
            <>
              <TextField label="Licence number" value={form.license} onChangeText={(v) => set('license', v.toUpperCase().slice(0, 12))} autoCapitalize="characters" error={err('license')} />
              <TextField
                label="Licence expiry"
                value={form.licenseExpiry}
                onChangeText={(v) => {
                  const d = onlyDigits(v, 8);
                  set('licenseExpiry', d.replace(/(\d{2})(\d{2})(\d{0,4})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join('.')));
                }}
                placeholder="DD.MM.YYYY"
                keyboardType="number-pad"
                error={err('licenseExpiry')}
              />
              <TextField label="Your vehicle make & model" value={form.vehicle} onChangeText={(v) => set('vehicle', v)} autoCapitalize="words" placeholder="Toyota RAV4" error={err('vehicle')} />
              <TextField
                label="Plate number"
                value={form.plate}
                onChangeText={(v) => set('plate', v.toUpperCase().slice(0, 10))}
                autoCapitalize="characters"
                placeholder="RAD 123 A"
                error={err('plate')}
              />
            </>
          )}

          {step === 4 && (
            <>
              <DocUploadField
                label="National ID (front)"
                hint="Good light, all four corners visible"
                fileName="national-id-front.jpg"
                value={form.idDoc}
                onChange={(v) => set('idDoc', v)}
              />
              <DocUploadField
                label="Driving licence"
                hint="No glare over the photo or numbers"
                fileName="driving-licence.jpg"
                value={form.licenseDoc}
                onChange={(v) => set('licenseDoc', v)}
                failOnce
              />
              {err('idDoc') || err('licenseDoc') ? (
                <ThemedText type="small" color={Colors.danger}>{err('idDoc') ?? err('licenseDoc')}</ThemedText>
              ) : null}
            </>
          )}

          {step === 5 && (
            <>
              <View style={styles.reviewCard}>
                <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`} onEdit={() => setStep(0)} />
                <ReviewRow label="Date of birth" value={form.dob} onEdit={() => setStep(0)} />
                <ReviewRow label="Email" value={form.email} onEdit={() => setStep(1)} />
                <ReviewRow label="Phone" value={form.altPhone || '—'} onEdit={() => setStep(1)} />
                <ReviewRow label="City" value={form.city} onEdit={() => setStep(1)} />
                <ReviewRow label="National ID" value={form.nationalId} onEdit={() => setStep(2)} />
                <ReviewRow label="Licence" value={`${form.license} · expires ${form.licenseExpiry}`} onEdit={() => setStep(3)} />
                <ReviewRow label="Vehicle" value={`${form.vehicle} · ${form.plate}`} onEdit={() => setStep(3)} />
                <ReviewRow label="Documents" value={form.idDoc && form.licenseDoc ? '2 attached (simulated)' : 'Missing'} onEdit={() => setStep(4)} />
              </View>
              <Pressable
                onPress={() => set('agree', !form.agree)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.agree }}
                style={styles.agreeRow}>
                <View style={[styles.checkbox, form.agree && styles.checkboxOn]}>
                  {form.agree ? <View style={styles.checkboxCheck} /> : null}
                </View>
                <ThemedText type="body" color={Colors.warmDim} style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
                  I confirm the information above is accurate. I understand this demo stores
                  everything only on this device and no real verification takes place.
                </ThemedText>
              </Pressable>
              {err('agree') ? <ThemedText type="small" color={Colors.danger}>{err('agree')}</ThemedText> : null}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {last ? (
            <Button title="Submit application" loading={submitting} disabled={submitting} onPress={() => void submit()} accessoryRight={<ChevronRight />} />
          ) : (
            <Button title="Continue" onPress={next} accessoryRight={<ChevronRight />} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <Pressable
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Edit`}
      style={styles.reviewRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="label">{label}</ThemedText>
        <ThemedText type="body" style={{ fontSize: 15 }}>{value || '—'}</ThemedText>
      </View>
      <ThemedText type="small" color={Colors.mint}>Edit</ThemedText>
    </Pressable>
  );
}

function validateStep(step: number, f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (step === 0) {
    if (f.firstName.trim().length < 2) e.firstName = 'Enter your first name.';
    if (f.lastName.trim().length < 2) e.lastName = 'Enter your last name.';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(f.dob)) e.dob = 'Use DD.MM.YYYY.';
  }
  if (step === 1) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (f.altPhone && normalizeDigits(f.altPhone).length !== 9) e.altPhone = 'Enter 9 digits or leave it empty.';
    if (f.city.trim().length < 2) e.city = 'Enter your city.';
  }
  if (step === 2 && f.nationalId.length !== 16) e.nationalId = 'The National ID has 16 digits.';
  if (step === 3) {
    if (f.license.trim().length < 7) e.license = 'Licence numbers are at least 7 characters.';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(f.licenseExpiry)) e.licenseExpiry = 'Use DD.MM.YYYY.';
    if (f.vehicle.trim().length < 3) e.vehicle = 'Enter your vehicle make and model.';
    if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(f.plate.replace(/\s/g, ''))) e.plate = 'Format: RAD 123 A.';
  }
  if (step === 4) {
    if (!f.idDoc) e.idDoc = 'Attach the National ID photo (simulated).';
    if (!f.licenseDoc) e.licenseDoc = 'Attach the licence photo (simulated).';
  }
  if (step === 5 && !f.agree) e.agree = 'Please confirm before submitting.';
  return e;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inkSurface,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.warm,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.inkSurfaceHi,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: Colors.mint },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    flexGrow: 1,
  },
  title: { fontSize: 26, lineHeight: 32 },
  why: { marginTop: -Spacing.two },
  fillChip: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  reviewCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inkBorder,
  },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, paddingHorizontal: Spacing.two },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  checkboxCheck: {
    width: 11,
    height: 6,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: Colors.ink,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
});
