/** Same shape the backend accepts for the OTP request (ADR-0025: email is the identity). */
export function isValidEmail(text: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text.trim());
}

/** Mask the local part but keep the first letter and the domain: "j••••@example.com". */
export function maskEmail(email: string | null) {
  if (!email) return 'your email';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const head = local.slice(0, 1);
  return `${head}${'•'.repeat(4)}@${domain}`;
}
