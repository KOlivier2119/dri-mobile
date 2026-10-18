/** Max local-number digits accepted before the mock layer refuses input. */
export const MAX_LOCAL_DIGITS = 9;

/** Keep the caret stable: reformat only when the raw digits are unchanged. */
export function formatLocal(digits: string) {
  return digits.replace(/(\d{2})(\d{0,3})(\d{0,4})/, (_m, a, b, c) =>
    [a, b, c].filter(Boolean).join(' '),
  );
}

/** Strip non-digits, drop a leading 0 trunk prefix, clamp to the local length. */
export function normalizeDigits(text: string, max = MAX_LOCAL_DIGITS) {
  let digits = text.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, max);
}

/** True when the input contains a complete local number. */
export function isCompleteLocalNumber(text: string) {
  return normalizeDigits(text).length === MAX_LOCAL_DIGITS;
}

/** Compose the stored mock display form: "+250 781234567". Never duplicates the dial code. */
export function toDialString(dial: string, phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith(dial) && digits.length > MAX_LOCAL_DIGITS) digits = digits.slice(dial.length);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return `+${dial} ${digits.slice(0, MAX_LOCAL_DIGITS)}`;
}

/** Mask everything but the last 4 digits: "+250 781234567" → "+250 ••• 4567". */
export function maskPhone(phone: string | null) {
  if (!phone) return 'your number';
  const tail = phone.replace(/\D/g, '').slice(-4);
  const head = phone.trim().split(' ')[0];
  return `${head} ••• ${tail}`;
}
