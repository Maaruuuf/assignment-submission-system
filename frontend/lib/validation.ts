// A pragmatic email regex: requires a local part, an @, a domain with at least one dot, and a
// TLD of 2+ letters - enough to reject "name@domain" while accepting real addresses. No regex
// perfectly validates email per spec; this matches what the login/user forms need.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
