export function isValidUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function isValidEmail(value) {
  if (!value) return false;

  const email = String(value).trim().toLowerCase();
  if (email.length > 254 || email.includes('..')) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain || !domain.includes('.')) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function sendValidationErrors(response, errors) {
  response.status(400).json({ errors });
}
