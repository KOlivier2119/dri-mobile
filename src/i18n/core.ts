import { en } from '@/i18n/messages/en';
import { fr } from '@/i18n/messages/fr';
import { rw } from '@/i18n/messages/rw';

/** The app's languages. Kinyarwanda first: DRI is a Rwandan service. */
export const LOCALES = ['rw', 'en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  rw: 'Ikinyarwanda',
  en: 'English',
  fr: 'Français',
};

/** A plural message: `one` for a single item, `other` for the rest. */
export type Plural = { one: string; other: string };

/** English is the source of truth; other catalogs must match its shape exactly. */
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends Plural ? Plural : Shape<T[K]> };
export type Messages = Shape<typeof en>;

/** Every leaf path in the catalog, e.g. `auth.signIn.title`. */
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | Plural ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Paths<Messages>;

export type Vars = Record<string, string | number>;

const CATALOGS: Record<Locale, Messages> = { en, rw, fr };

/** CLDR plural categories, reduced to one/other: French counts 0 as singular. */
function pluralOf(locale: Locale, n: number): keyof Plural {
  if (locale === 'fr') return n >= 0 && n < 2 ? 'one' : 'other';
  return n === 1 ? 'one' : 'other';
}

function lookup(catalog: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalog);
}

/**
 * Resolve a key in `locale`, falling back to English (a catalog can't be
 * missing keys at compile time, but this keeps a bad merge from showing a
 * raw key). `{name}` placeholders are filled from `vars`; a plural message
 * reads `vars.count`.
 */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  let value = lookup(CATALOGS[locale], key) ?? lookup(en, key);
  if (value && typeof value === 'object') {
    const count = Number(vars?.count ?? 0);
    value = (value as Plural)[pluralOf(locale, count)];
  }
  if (typeof value !== 'string') return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Map a device language to one we support, else English. */
export function pickLocale(languageCodes: (string | null | undefined)[]): Locale {
  for (const code of languageCodes) {
    const base = code?.toLowerCase().split(/[-_]/)[0];
    if (base === 'rw' || base === 'kin') return 'rw';
    if (base === 'fr') return 'fr';
    if (base === 'en') return 'en';
  }
  return 'en';
}

/* -------------------------------- formatting ------------------------------- */
/*
 * Dates are formatted from the catalogs rather than Intl: Hermes ships
 * without Kinyarwanda calendar data, so Intl would print English month names
 * inside a Kinyarwanda sentence. Times use the 24-hour clock, as in Rwanda.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Fri 23 Oct" / "Ven. 23 oct." / "Kuwa 5, 23 Ukw" */
export function formatShortDate(locale: Locale, date: Date) {
  const m = CATALOGS[locale].calendar;
  return translate(locale, 'calendar.shortDate', {
    weekday: m.weekdaysShort.split(',')[date.getDay()],
    day: date.getDate(),
    month: m.monthsShort.split(',')[date.getMonth()],
  });
}

export function weekdayShort(locale: Locale, date: Date) {
  return CATALOGS[locale].calendar.weekdaysShort.split(',')[date.getDay()];
}

/** Integer RWF with the locale's grouping: 18,500 (en, rw) or 18 500 (fr). */
export function formatAmount(locale: Locale, amount: number | string) {
  const sep = locale === 'fr' ? ' ' : ',';
  return Math.round(Number(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
