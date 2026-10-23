import { formatLocal, isCompleteLocalNumber, maskPhone, normalizeDigits, toE164 } from '@/utils/phone';

describe('phone input normalization', () => {
  it('strips non-digits and clamps to the local length', () => {
    expect(normalizeDigits('078 123-4567')).toBe('781234567');
    expect(normalizeDigits('7812345678901')).toBe('781234567');
    expect(normalizeDigits('abc')).toBe('');
  });

  it('drops the +250 dial code the API returns', () => {
    expect(normalizeDigits('+250788123456')).toBe('788123456');
  });

  it('formats a 9-digit local number as 2-3-4 groups', () => {
    expect(formatLocal('781234567')).toBe('78 123 4567');
    expect(formatLocal('78')).toBe('78');
    expect(formatLocal('78123')).toBe('78 123');
    expect(formatLocal('')).toBe('');
  });

  it('builds the E.164 form without duplicating the country code', () => {
    expect(toE164('78 123 4567')).toBe('+250781234567');
    expect(toE164('0781234567')).toBe('+250781234567');
    expect(toE164('+250 781234567')).toBe('+250781234567');
  });

  it('detects complete numbers only at full length', () => {
    expect(isCompleteLocalNumber('78 123 456')).toBe(false);
    expect(isCompleteLocalNumber('78 123 4567')).toBe(true);
  });

  it('masks a phone for display', () => {
    expect(maskPhone('+250781234567')).toBe('+250 ••• 4567');
    expect(maskPhone(null)).toBe('your number');
  });
});
