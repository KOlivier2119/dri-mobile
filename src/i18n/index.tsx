import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import * as React from 'react';
import { AppState } from 'react-native';

import {
  formatAmount,
  formatShortDate,
  formatTime,
  pickLocale,
  translate,
  weekdayShort,
  type Locale,
  type MessageKey,
  type Vars,
} from '@/i18n/core';

export { LOCALES, LOCALE_NAMES, type Locale, type MessageKey } from '@/i18n/core';

const STORAGE_KEY = 'dri.locale';

/**
 * Current language for code outside React (the API client's Accept-Language
 * header and its fallback error messages). Kept in sync by the provider.
 */
let current: Locale = deviceLocale();

function deviceLocale(): Locale {
  try {
    return pickLocale(getLocales().map((l) => l.languageCode));
  } catch {
    return 'en';
  }
}

export function currentLocale() {
  return current;
}

/** Translate outside React, in the current language. */
export function tr(key: MessageKey, vars?: Vars) {
  return translate(current, key, vars);
}

type I18n = {
  locale: Locale;
  /** null while following the device language */
  chosen: Locale | null;
  setLocale: (locale: Locale | null) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  time: (date: Date) => string;
  shortDate: (date: Date) => string;
  weekday: (date: Date) => string;
  amount: (value: number | string) => string;
  /** null → "Now"; otherwise "Today, 17:00" / "Tomorrow, 07:30" / "Fri 23 Oct, 09:15" */
  departure: (date: Date | null) => string;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const I18nContext = React.createContext<I18n>(null as never);

/**
 * Language: the person's explicit choice if they made one, else the device
 * language when it's one we support, else English. The choice is remembered.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [chosen, setChosen] = React.useState<Locale | null>(null);
  const [device, setDevice] = React.useState<Locale>(current);

  React.useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'rw' || v === 'en' || v === 'fr') setChosen(v);
      })
      .catch(() => {});
    // Android lets the system language change while the app runs
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setDevice(deviceLocale());
    });
    return () => sub.remove();
  }, []);

  const locale = chosen ?? device;
  React.useEffect(() => {
    // keep the module copy current for the API client
    current = locale;
  }, [locale]);

  const value = React.useMemo<I18n>(
    () => ({
      locale,
      chosen,
      setLocale: (next) => {
        setChosen(next);
        if (next) void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
        else void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      },
      t: (key, vars) => translate(locale, key, vars),
      time: formatTime,
      shortDate: (date) => formatShortDate(locale, date),
      weekday: (date) => weekdayShort(locale, date),
      amount: (v) => formatAmount(locale, v),
      departure: (date) => {
        if (!date) return translate(locale, 'when.now');
        const time = formatTime(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (sameDay(date, today)) return translate(locale, 'when.todayAt', { time });
        if (sameDay(date, tomorrow)) return translate(locale, 'when.tomorrowAt', { time });
        return translate(locale, 'when.dateAt', { date: formatShortDate(locale, date), time });
      },
    }),
    [locale, chosen],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return React.useContext(I18nContext);
}
