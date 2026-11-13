import { AccountError } from '../auth/service.js';

// GS1 modulo-10: alternate weights 3/1 from the rightmost data digit.
// https://www.gs1uk.org/knowledge-hub/standards/what-is-a-check-digit
export function normalizeBarcode(value) {
  const fail = () => {
    throw new AccountError('Enter an 8, 12, 13 or 14 digit barcode with a valid check digit.');
  };
  if (typeof value !== 'string') fail();
  const input = value.trim();
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(input) || /^0+$/.test(input)) fail();
  const data = [...input.slice(0, -1)].reverse();
  const sum = data.reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 1 : 3), 0);
  if ((10 - (sum % 10)) % 10 !== Number(input.at(-1))) fail();
  return { input, gtin14: input.padStart(14, '0') };
}
