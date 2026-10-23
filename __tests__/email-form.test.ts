import { isValidEmail, maskEmail } from '@/utils/email';

describe('email identity (ADR-0025)', () => {
  it('accepts well-formed addresses and rejects the rest', () => {
    expect(isValidEmail('jean@example.com')).toBe(true);
    expect(isValidEmail('  Jean.Mugisha@dri.rw  ')).toBe(true);
    expect(isValidEmail('jean@example')).toBe(false);
    expect(isValidEmail('jean@@example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('masks the local part but keeps the domain readable', () => {
    expect(maskEmail('jean.mugisha@example.com')).toBe('j••••@example.com');
    expect(maskEmail('ab@example.com')).toBe('a••••@example.com');
    expect(maskEmail(null)).toBe('your email');
  });
});
