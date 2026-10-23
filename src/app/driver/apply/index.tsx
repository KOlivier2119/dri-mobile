import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { FormError, errorMessage } from '@/components/ui/form-error';
import { BackButton, Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { DocUploadField } from '@/components/ui/doc-upload';
import { CheckIcon } from '@/components/onboarding/illustrations';
import { Drivers } from '@/api/endpoints';
import type { DocType, DriverApplication } from '@/api/types';
import { useLayout } from '@/hooks/use-layout';
import { useSession } from '@/store/session';
import { useI18n, type MessageKey } from '@/i18n';

/**
 * Driver onboarding: POST /drivers/applications (fields mirror the backend
 * `applicationFormSchema`), then each required document is uploaded to that
 * application. The fee and admin review follow. This never grants the DRIVER
 * role — only an admin approval does.
 */

const REGISTRATION_FEE_RWF = 5000;
/** Sent to the API by these canonical names; only the chip labels are translated. */
const LANGUAGE_OPTIONS = ['Kinyarwanda', 'English', 'French', 'Swahili'] as const;
const REQUIRED_DOCS: DocType[] = ['NATIONAL_ID', 'DRIVERS_LICENSE', 'PROFILE_PHOTO'];

type Form = {
  legalName: string;
  licenseNumber: string;
  nationalIdNumber: string;
  licenseExpiry: string;
  yearsDriving: string;
  languages: string[];
  addressNote: string;
  gearbox: 'MANUAL' | 'AUTOMATIC' | null;
  agree: boolean;
};

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

const dotDate = (v: string) => {
  const d = onlyDigits(v, 8);
  return d.replace(/(\d{2})(\d{2})(\d{0,4})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join('.'));
};

/** "31.12.2030" → "2030-12-31", or null when it isn't a real future date. */
function toIsoDate(v: string) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(m[1])) return null;
  return date.getTime() > Date.now() ? iso : null;
}

/** Field problems as message keys, so validation stays independent of the language. */
function validate(f: Form): Partial<Record<keyof Form, MessageKey>> {
  const e: Partial<Record<keyof Form, MessageKey>> = {};
  if (f.legalName.trim().length < 2) e.legalName = 'apply.invalid.legalName';
  if (f.licenseNumber.trim().length < 5) e.licenseNumber = 'apply.invalid.licence';
  if (f.nationalIdNumber.length !== 16) e.nationalIdNumber = 'apply.invalid.nationalId';
  if (!toIsoDate(f.licenseExpiry)) e.licenseExpiry = 'apply.invalid.expiry';
  const years = Number(f.yearsDriving);
  if (f.yearsDriving === '' || !Number.isInteger(years) || years > 60) e.yearsDriving = 'apply.invalid.years';
  if (f.languages.length < 1) e.languages = 'apply.invalid.languages';
  if (!f.gearbox) e.gearbox = 'apply.invalid.gearbox';
  if (!f.agree) e.agree = 'apply.invalid.agree';
  return e;
}

export default function DriverApplyScreen() {
  const { session, refresh } = useSession();
  const { t, amount } = useI18n();
  const { gutter } = useLayout();
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<Form>({
    legalName: session.user?.displayName ?? '',
    licenseNumber: '',
    nationalIdNumber: '',
    licenseExpiry: '',
    yearsDriving: '',
    languages: [],
    addressNote: '',
    gearbox: null,
    agree: false,
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // resume an open application (e.g. documents still missing)
  useEffect(() => {
    if (!session.user) return;
    void (async () => {
      try {
        const apps = await Drivers.applications();
        const open = apps.find((a) => a.status === 'SUBMITTED' && !a.decidedAt);
        setApplication(open ?? null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoaded(true);
      }
    })();
  }, [session.user]);

  if (!session.user) return <Redirect href="/" />;

  const step = application ? 1 : 0;
  const uploaded = new Set(application?.documents.map((d) => d.docType));
  const docsDone = REQUIRED_DOCS.every((d) => uploaded.has(d));

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleLanguage = (lang: string) =>
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang],
    }));

  const errors = validate(form);
  const err = (k: keyof Form) => {
    const key = touched ? errors[k] : undefined;
    return key ? t(key) : null;
  };

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/role');
  };

  const submit = async () => {
    setTouched(true);
    setError(null);
    if (busy || Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      const created = await Drivers.apply({
        legalName: form.legalName.trim(),
        licenseNumber: form.licenseNumber.trim(),
        nationalIdNumber: form.nationalIdNumber,
        licenseExpiry: toIsoDate(form.licenseExpiry)!,
        yearsDriving: Number(form.yearsDriving),
        languages: form.languages,
        addressNote: form.addressNote.trim() || undefined,
        drivesManual: form.gearbox === 'MANUAL',
      });
      setApplication({ ...created, documents: created.documents ?? [] });
      setTouched(false);
      await refresh().catch(() => {});
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reloadApplication = async () => {
    const apps = await Drivers.applications().catch(() => null);
    const open = apps?.find((a) => a.id === application?.id);
    if (open) setApplication(open);
  };

  const finish = async () => {
    setBusy(true);
    await refresh().catch(() => {});
    router.replace('/');
  };

  return (
    <Screen
      header={
        <View style={[styles.header, { paddingHorizontal: gutter }]}>
          <BackButton onPress={back} />
          <View style={{ flex: 1, gap: 6 }}>
            <ThemedText type="label">{t('apply.step', { step: step + 1, total: 3 })}</ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
            </View>
          </View>
        </View>
      }
      footer={
        !loaded ? undefined : step === 0 ? (
          <Button title={t('apply.submit')} loading={busy} onPress={() => void submit()} accessoryRight={<ChevronRight />} />
        ) : (
          <Button
            title={t('common.continue')}
            loading={busy}
            disabled={!docsDone}
            onPress={() => void finish()}
            accessoryRight={<ChevronRight />}
          />
        )
      }>
      <View style={styles.intro}>
        <ThemedText type="title">{step === 0 ? t('apply.aboutTitle') : t('apply.docsTitle')}</ThemedText>
        <ThemedText type="body" color={Colors.textDim}>
          {step === 0
            ? t('apply.aboutSubtitle')
            : t('apply.docsSubtitle')}
        </ThemedText>
      </View>

      {!loaded ? (
        <ThemedText type="caption">{t('common.loading')}</ThemedText>
      ) : step === 0 ? (
        <>
          <TextField
            label={t('apply.legalName')}
            value={form.legalName}
            onChangeText={(v) => set('legalName', v)}
            autoCapitalize="words"
            autoComplete="name"
            error={err('legalName')}
          />
          <TextField
            label={t('apply.licence')}
            value={form.licenseNumber}
            onChangeText={(v) => set('licenseNumber', v.toUpperCase().slice(0, 40))}
            autoCapitalize="characters"
            error={err('licenseNumber')}
          />
          <TextField
            label={t('apply.nationalId')}
            value={form.nationalIdNumber}
            onChangeText={(v) => set('nationalIdNumber', onlyDigits(v, 16))}
            keyboardType="number-pad"
            helper={t('apply.nationalIdHelp')}
            error={err('nationalIdNumber')}
          />
          <View style={styles.pair}>
            <TextField
              label={t('apply.expiry')}
              value={form.licenseExpiry}
              onChangeText={(v) => set('licenseExpiry', dotDate(v))}
              placeholder={t('apply.expiryPlaceholder')}
              keyboardType="number-pad"
              error={err('licenseExpiry')}
              containerStyle={styles.pairItem}
            />
            <TextField
              label={t('apply.years')}
              value={form.yearsDriving}
              onChangeText={(v) => set('yearsDriving', onlyDigits(v, 2))}
              keyboardType="number-pad"
              placeholder={t('apply.yearsPlaceholder')}
              error={err('yearsDriving')}
              containerStyle={styles.pairItem}
            />
          </View>
          <View style={styles.group}>
            <Segmented
              label={t('apply.carsYouCanDrive')}
              value={form.gearbox}
              onChange={(v) => set('gearbox', v)}
              options={[
                { value: 'MANUAL', label: t('apply.manualAndAuto') },
                { value: 'AUTOMATIC', label: t('apply.autoOnly') },
              ]}
            />
            {err('gearbox') ? (
              <ThemedText type="small" color={Colors.danger} style={styles.groupLabel}>
                {err('gearbox')}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.group}>
            <ThemedText type="label" style={styles.groupLabel}>
              {t('apply.languages')}
            </ThemedText>
            <View style={styles.langRow}>
              {LANGUAGE_OPTIONS.map((lang) => {
                const on = form.languages.includes(lang);
                return (
                  <Pressable
                    key={lang}
                    onPress={() => toggleLanguage(lang)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={t('apply.languageA11y', { name: t(`apply.spoken.${lang}`) })}
                    style={({ pressed }) => [
                      styles.langChip,
                      on && styles.langChipOn,
                      pressed && !on && { backgroundColor: Colors.surfaceAlt },
                    ]}>
                    {on ? <CheckIcon size={14} color={Colors.primary} strokeWidth={2.6} /> : null}
                    <ThemedText type="small" color={on ? Colors.primary : Colors.textDim}>
                      {t(`apply.spoken.${lang}`)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {err('languages') ? (
              <ThemedText type="small" color={Colors.danger} style={styles.groupLabel}>
                {err('languages')}
              </ThemedText>
            ) : null}
          </View>
          <TextField
            label={t('apply.waitingArea')}
            value={form.addressNote}
            onChangeText={(v) => set('addressNote', v.slice(0, 240))}
            multiline
            numberOfLines={3}
            placeholder={t('apply.waitingPlaceholder')}
          />
          <Pressable
            onPress={() => set('agree', !form.agree)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.agree }}
            style={styles.agreeRow}>
            <View style={[styles.checkbox, form.agree && styles.checkboxOn]}>
              {form.agree ? <CheckIcon size={16} color={Colors.onPrimary} strokeWidth={2.8} /> : null}
            </View>
            <ThemedText type="caption" style={{ flex: 1 }}>
              {t('apply.agree', { amount: amount(REGISTRATION_FEE_RWF) })}
            </ThemedText>
          </Pressable>
          {err('agree') ? <ThemedText type="small" color={Colors.danger}>{err('agree')}</ThemedText> : null}
        </>
      ) : (
        REQUIRED_DOCS.map((d) => (
          <DocUploadField
            key={d}
            label={t(`apply.doc.${d}`)}
            hint={t(`apply.doc.${d}_HINT`)}
            docType={d}
            applicationId={application!.id}
            uploaded={uploaded.has(d)}
            onUploaded={() => void reloadApplication()}
          />
        ))
      )}

      <FormError message={error} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: Colors.primary },
  intro: { gap: Spacing.two },
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  pairItem: { flexGrow: 1, flexBasis: 140 },
  group: { gap: Spacing.two },
  groupLabel: { color: Colors.text, marginLeft: Spacing.one },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: Spacing.two,
  },
  langChipOn: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});
