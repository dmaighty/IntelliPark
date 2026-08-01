export function getPasswordChecks(password) {
  return {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    length: password.length >= 8 && password.length <= 20,
  };
}

export function isPasswordValid(password) {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

export function maskEmail(email) {
  const value = String(email || '').trim();
  const [local, domain] = value.split('@');

  if (!local || !domain) {
    return value || '—';
  }

  const visible = local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (digits.length < 4) {
    return phone || '—';
  }

  return `(***) ***-${digits.slice(-4)}`;
}
