const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const BLOCKED_HTML_BLOCK = /<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG = /<[^>]*>/g;

export function sanitizeText(value, { maxLength = 160, fallback = '' } = {}) {
  if (value === null || value === undefined) return fallback;

  const normalized = String(value)
    .replace(CONTROL_CHARACTERS, '')
    .replace(BLOCKED_HTML_BLOCK, ' ')
    .replace(HTML_TAG, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.slice(0, maxLength) || fallback;
}

export function sanitizeNullableText(value, options) {
  const sanitized = sanitizeText(value, options);
  return sanitized || null;
}

export function sanitizeStatus(value) {
  const allowedStatuses = new Set(['Agendada', 'Em andamento', 'Encerrada', 'Cancelada', 'Pendente', 'Confirmada']);
  const status = sanitizeText(value, { maxLength: 32, fallback: 'Agendada' });

  return allowedStatuses.has(status) ? status : 'Agendada';
}
