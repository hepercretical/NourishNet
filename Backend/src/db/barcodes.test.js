import { expect, it } from 'vitest';
import { normalizeBarcode } from './barcodes.js';

it.each(['030000010204', '0030000010204', '00030000010204'])(
  'preserves input zeros and resolves %s to the same canonical catalog key',
  (input) => {
    expect(normalizeBarcode(` ${input}\n`)).toEqual({ input, gtin14: '00030000010204' });
  },
);
it.each(['96385074', '6291041500213', '00051500255162'])(
  'validates the supported GS1 check digit for %s',
  (input) => expect(normalizeBarcode(input).gtin14).toBe(input.padStart(14, '0')),
);
it.each([
  null,
  30000010204,
  '',
  '00000000',
  '00000000000000',
  '030000010205',
  '03000 0010204',
  '030000010204x',
  '3e11',
  '1234567',
  '123456789',
  '１２３４５６７８',
])('rejects malformed, zero, numeric or bad-check-digit input %j', (input) => {
  expect(() => normalizeBarcode(input)).toThrow('valid check digit');
});
