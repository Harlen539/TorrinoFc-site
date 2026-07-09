export function parseDateInput(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseTimeInput(value) {
  if (!value) return null;

  const normalized = String(value).length === 5 ? `${value}:00` : String(value);
  const time = new Date(`1970-01-01T${normalized}.000Z`);
  return Number.isNaN(time.getTime()) ? null : time;
}
