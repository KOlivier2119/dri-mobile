import { en } from '@/i18n/messages/en';
import { fr } from '@/i18n/messages/fr';
import { rw } from '@/i18n/messages/rw';
import { formatAmount, formatShortDate, pickLocale, translate } from '@/i18n/core';

/** Every leaf path in a catalog. */
function paths(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k));
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const at = (cat: unknown, path: string) => path.split('.').reduce<unknown>((n, p) => (n as Record<string, unknown>)[p], cat);

describe('catalogs', () => {
  const english = paths(en);

  it.each([
    ['rw', rw],
    ['fr', fr],
  ])('%s has every English key and nothing extra', (_, cat) => {
    expect(paths(cat).sort()).toEqual([...english].sort());
  });

  it.each([
    ['rw', rw],
    ['fr', fr],
  ])('%s keeps the same {placeholders} as English', (_, cat) => {
    for (const p of english) {
      expect([p, placeholders(at(cat, p) as string)]).toEqual([p, placeholders(at(en, p) as string)]);
    }
  });

  it.each([
    ['rw', rw],
    ['fr', fr],
  ])('%s has no empty strings', (_, cat) => {
    for (const p of paths(cat)) expect([p, (at(cat, p) as string).trim().length > 0]).toEqual([p, true]);
  });

  it('calendar lists have 7 weekdays and 12 months in every language', () => {
    for (const cat of [en, rw, fr]) {
      expect(cat.calendar.weekdaysShort.split(',')).toHaveLength(7);
      expect(cat.calendar.monthsShort.split(',')).toHaveLength(12);
    }
  });
});

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'booking.pay', { amount: '25,000' })).toBe('Pay 25,000 RWF');
    expect(translate('rw', 'booking.pay', { amount: '25,000' })).toBe('Ishyura 25,000 RWF');
  });

  it('picks plural forms per language (French counts 0 as singular)', () => {
    expect(translate('en', 'home.nearby', { count: 1 })).toBe('1 driver nearby');
    expect(translate('en', 'home.nearby', { count: 3 })).toBe('3 drivers nearby');
    expect(translate('fr', 'home.nearby', { count: 0 })).toBe('0 chauffeur à proximité');
    expect(translate('rw', 'home.nearby', { count: 2 })).toBe('Abashoferi 2 bari hafi');
  });
});

describe('locale detection and formatting', () => {
  it('maps device languages to supported ones, defaulting to English', () => {
    expect(pickLocale(['rw-RW'])).toBe('rw');
    expect(pickLocale(['kin'])).toBe('rw');
    expect(pickLocale(['fr-FR', 'en-US'])).toBe('fr');
    expect(pickLocale(['sw-KE', 'en-GB'])).toBe('en');
    expect(pickLocale(['de-DE'])).toBe('en');
  });

  it('formats dates from the catalogs, not device data', () => {
    const d = new Date(2026, 9, 23); // Fri 23 Oct 2026
    expect(formatShortDate('en', d)).toBe('Fri 23 Oct');
    expect(formatShortDate('fr', d)).toBe('ven. 23 oct.');
    expect(formatShortDate('rw', d)).toBe('Gnu 23 Ukw');
  });

  it('groups RWF amounts per language', () => {
    expect(formatAmount('en', '25000')).toBe('25,000');
    expect(formatAmount('rw', 18500)).toBe('18,500');
    expect(formatAmount('fr', 18500)).toBe('18 500');
  });
});
