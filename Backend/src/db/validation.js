export function identityPart(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 500 || !value.trim()) {
    throw new TypeError('A verified identity issuer and subject are required.');
  }
  // Identity provider identifiers are opaque; never trim or change their case.
  return value;
}

export function localDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError('Use a real local date in YYYY-MM-DD format.');
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    value.startsWith('0000') ||
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new TypeError('Use a real local date in YYYY-MM-DD format.');
  }
  return value;
}

export function nutritionAmount(value, { positive = false, nullable = false } = {}) {
  if (value === null && nullable) return null;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 100000000 ||
    (positive && value === 0)
  ) {
    throw new TypeError('Enter a valid amount within the supported storage range.');
  }
  // A decimal textual check rejects excess precision instead of rounding it.
  if (!/^\d+(?:\.\d{1,4})?$/.test(String(value))) {
    throw new TypeError('Use no more than four decimal places.');
  }
  return value;
}
