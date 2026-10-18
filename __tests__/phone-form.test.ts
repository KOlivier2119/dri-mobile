import {
  formatLocal,
  isCompleteLocalNumber,
  maskPhone,
  normalizeDigits,
  phoneSchema,
  toDialString,
} from '@/utils/phone';
import { MOCK } from '@/store/session';

describe('phone input normalization', () => {
  it('strips non-digits and clamps to the local length', () => {
    expect(normalizeDigits('078 123-4567')).toBe('781234567');
    expect(normalizeDigits('7812345678901')).toBe('781234567');
    expect(normalizeDigits('abc')).toBe('');
  });

  it('formats a 9-digit local number as 2-3-4 groups', () => {
    expect(formatLocal('781234567')).toBe('78 123 4567');
    expect(formatLocal('78')).toBe('78');
    expect(formatLocal('78123')).toBe('78 123');
    expect(formatLocal('')).toBe('');
  });

  it('never duplicates the country code into the local number', () => {
    expect(toDialString('250', '+250 78123 4567')).toBe('+250 781234567');
    expect(toDialString('250', '78 123 4567')).toBe('+250 781234567');
  });

  it('detects complete numbers only at full length', () => {
    expect(isCompleteLocalNumber('78 123 456')).toBe(false);
    expect(isCompleteLocalNumber('78 123 4567')).toBe(true);
  });
});

describe('phone schema validation', () => {
  it('accepts a formatted 9-digit number', () => {
    const parsed = phoneSchema.safeParse({ dial: '250', phone: '78 123 4567' });
    expect(parsed.success).toBe(true);
  });

  it('rejects incomplete numbers with a human message', () => {
    const parsed = phoneSchema.safeParse({ dial: '250', phone: '78123' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toMatch(/full 9-digit/);
    }
  });

  it('rejects a missing country code', () => {
    const parsed = phoneSchema.safeParse({ dial: '', phone: '781234567' });
    expect(parsed.success).toBe(false);
  });
});

describe('otp contract', () => {
  it('mock code is exactly 6 digits', () => {
    expect(MOCK.otpCode).toMatch(/^\d{6}$/);
  });

  it('masks the demo phone for display', () => {
    expect(maskPhone('+250 781234567')).toBe('+250 ••• 4567');
    expect(maskPhone(null)).toBe('your number');
  });
});
