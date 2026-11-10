import { expect, it } from 'vitest';
import { displayNutrition, scaleNutrition } from './nutrition.js';

it('scales decimals without mutating the serving snapshot and preserves zero and unknown', () => {
  const original = { calories: 150, protein: 5, fat: 0, carbohydrates: 27, sodium: null };
  expect(scaleNutrition(original, 1.5)).toEqual({
    calories: 225,
    protein: 7.5,
    fat: 0,
    carbohydrates: 40.5,
    sodium: null,
  });
  expect(original.calories).toBe(150);
  expect(scaleNutrition({}, 1).sodium).toBeNull();
});

it('rejects nonpositive, nonfinite, and overflowing amounts', () => {
  for (const amount of [0, -1, NaN, Infinity]) expect(() => scaleNutrition({}, amount)).toThrow();
  expect(() => scaleNutrition({ calories: 150 }, Number.MAX_VALUE)).toThrow();
});

it('rounds only display values consistently to at most two decimal places', () => {
  const raw = scaleNutrition({ calories: 1, protein: 0.1, sodium: null }, 3);
  expect(displayNutrition(raw)).toMatchObject({ calories: 3, protein: 0.3, sodium: null });
  expect(displayNutrition({ fat: 2.3456 }).fat).toBe(2.35);
  expect(raw.protein).toBe(0.1 * 3);
});
