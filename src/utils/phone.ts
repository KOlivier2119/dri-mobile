/** Digits in a Rwandan mobile number after the +250 dial code. */
export const MAX_LOCAL_DIGITS = 9;

/** Keep the caret stable: reformat only when the raw digits are unchanged. */
export function formatLocal(digits: string) {
  return digits.replace(/(\d{2})(\d{0,3})(\d{0,4})/, (_m, a, b, c) =>
    [a, b, c].filter(Boolean).join(' '),
  );
}

/** Strip non-digits, the 250 dial code and a leading 0 trunk prefix; clamp to the local length. */
export function normalizeDigits(text: string, max = MAX_LOCAL_DIGITS) {
  let digits = text.replace(/\D/g, '');
  if (digits.startsWith('250') && digits.length > max) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, max);
}

/** True when the input contains a complete local number. */
export function isCompleteLocalNumber(text: string) {
  return normalizeDigits(text).length === MAX_LOCAL_DIGITS;
}

/** "78 812 3456" → "+250788123456", the form the API stores. */
export function toE164(text: string) {
  return `+250${normalizeDigits(text)}`;
}

/** Mask everything but the last 4 digits: "+250788123456" → "+250 ••• 3456". */
export function maskPhone(phone: string | null) {
  if (!phone) return 'your number';
  const digits = phone.replace(/\D/g, '');
  return `+250 ••• ${digits.slice(-4)}`;
}
