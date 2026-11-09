import { describe, expect, it } from 'vitest';
import { identityPart, localDate, nutritionAmount } from './validation.js';

describe('development data validation', () => {
  it('preserves a valid local date, including leap day, without timezone conversion', () => {
    expect(localDate('2028-02-29')).toBe('2028-02-29');
    expect(localDate('2026-11-09')).toBe('2026-11-09');
  });
  it.each([
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-1-01',
    '0000-01-01',
    '2026-11-09T00:00:00Z',
    null,
  ])('rejects invalid local date %s', (value) => expect(() => localDate(value)).toThrow(TypeError));
  it('accepts decimal servings and distinguishes unknown sodium from known zero', () => {
    expect(nutritionAmount(1.5, { positive: true })).toBe(1.5);
    expect(nutritionAmount(0)).toBe(0);
    expect(nutritionAmount(null, { nullable: true })).toBeNull();
    expect(nutritionAmount(99999999.9999)).toBe(99999999.9999);
  });
  it.each([NaN, Infinity, -Infinity, -1, 100000000, 1.23456, '1.5', undefined, null])(
    'rejects invalid nutrient amount %s',
    (value) => expect(() => nutritionAmount(value)).toThrow(TypeError),
  );
  it('rejects a zero serving count', () => {
    expect(() => nutritionAmount(0, { positive: true })).toThrow(TypeError);
  });
  it('preserves opaque identity values without case or whitespace conversion', () => {
    expect(identityPart('Provider|Account-A')).toBe('Provider|Account-A');
  });
  it.each(['', ' ', 'a'.repeat(501), null, {}])('rejects invalid identity part %s', (value) => {
    expect(() => identityPart(value)).toThrow(TypeError);
  });
});
