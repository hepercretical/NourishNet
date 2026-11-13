import { expect, it, vi } from 'vitest';
import { validateGoal, personalRepository } from './personal.js';
import {
  estimateEnergy,
  goalOutcome,
  streaks,
  macroEnergy,
  localToday,
  shiftDay,
} from '../../../shared/personal.js';

const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const draft = {
  effectiveDate: '2026-11-12',
  calories: 2000,
  mode: 'maintain',
  macroMode: 'grams',
  macros: null,
  provenance: { kind: 'manual' },
  currentVersion: null,
  requestKey: key,
};

it('keeps local dates across leap days, year boundaries and daylight-saving transitions', () => {
  expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
  expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  expect(localToday('America/Denver', new Date('2026-03-08T06:30:00Z'))).toBe('2026-03-07');
  expect(localToday('America/Denver', new Date('2026-03-08T09:30:00Z'))).toBe('2026-03-08');
  expect(localToday('Pacific/Kiritimati', new Date('2026-11-12T12:00:00Z'))).toBe('2026-11-13');
});
it.each([
  ['male', 'inactive', 180, 80, 2726],
  ['male', 'low-active', 180, 80, 2946],
  ['male', 'active', 180, 80, 3126],
  ['male', 'very-active', 180, 80, 3496],
  ['female', 'inactive', 165, 65, 2080],
  ['female', 'low-active', 165, 65, 2244],
  ['female', 'active', 165, 65, 2381],
  ['female', 'very-active', 165, 65, 2614],
])(
  'checks the frozen %s %s equation against reviewed arithmetic',
  (sex, activity, height, weight, expected) => {
    expect(
      estimateEnergy({
        sex,
        activity,
        height,
        weight,
        age: 30,
        heightUnit: 'cm',
        weightUnit: 'kg',
      }),
    ).toBe(expected);
    expect(
      estimateEnergy({
        sex,
        activity,
        height: height / 2.54,
        weight: weight / 0.45359237,
        age: 30,
        heightUnit: 'in',
        weightUnit: 'lb',
      }),
    ).toBe(expected);
  },
);
it.each([18, NaN, Infinity, 19.5])('does not estimate unsupported or invalid age %s', (age) => {
  expect(
    estimateEnergy({
      sex: 'male',
      activity: 'inactive',
      height: 180,
      weight: 80,
      age,
      heightUnit: 'cm',
      weightUnit: 'kg',
    }),
  ).toBeNull();
});
it.each([
  [1950, 'met', 'light'],
  [1900, 'met', 'regular'],
  [1899.99999999, 'met', 'dark'],
  [2050, 'outside', 'light'],
  [2100, 'outside', 'regular'],
  [2100.00000001, 'outside', 'dark'],
])('uses exact deficit band at %s', (c, state, shade) => {
  expect(goalOutcome(c, 1, { mode: 'deficit', calories: 2000 })).toMatchObject({ state, shade });
});
it('handles inclusive maintenance boundaries, surplus and neutral missing data', () => {
  for (const calories of [1750, 2250])
    expect(goalOutcome(calories, 1, { mode: 'maintain', calories: 2000 }).state).toBe('met');
  expect(goalOutcome(2250.00000001, 1, { mode: 'maintain', calories: 2000 }).state).toBe('outside');
  expect(goalOutcome(2100, 1, { mode: 'surplus', calories: 2000 }).state).toBe('met');
  expect(goalOutcome(0, 0, draft).state).toBe('unlogged');
  expect(goalOutcome(null, 1, draft).state).toBe('unknown');
  expect(goalOutcome(200, 1, null).state).toBe('no-goal');
});
it('counts any saved food and historical targets without calling gaps failed days', () => {
  const goals = [
    { effectiveDate: '2026-11-08', mode: 'deficit', calories: 2000 },
    { effectiveDate: '2026-11-10', mode: 'surplus', calories: 2200 },
  ];
  const days = [
    { date: '2026-11-08', count: 1, calories: 1900 },
    { date: '2026-11-09', count: 1, calories: 1950 },
    { date: '2026-11-11', count: 1, calories: 2300 },
  ];
  expect(streaks(days, goals, '2026-11-12')).toEqual({
    current: 1,
    longest: 2,
    ending: '2026-11-11',
  });
  expect(streaks(days, goals, '2026-11-13').current).toBe(0);
});
it('uses macro energy rather than grams for chart proportions and preserves unknowns', () => {
  expect(macroEnergy({ protein: 10, carbohydrates: 10, fat: 10 })[2].percent).toBeCloseTo(
    (90 / 170) * 100,
  );
  expect(macroEnergy({ protein: 0, carbohydrates: 0, fat: 0 }).every((v) => v.percent === 0)).toBe(
    true,
  );
  expect(macroEnergy({ protein: 10, carbohydrates: 10, fat: null })).toBeNull();
});
it('validates manual/percent goals without inventing ratios or accepting retroactive dates', () => {
  expect(validateGoal(draft, '2026-11-12')).toBe(draft);
  expect(() =>
    validateGoal(
      { ...draft, macros: { protein: 30, carbohydrates: 50, fat: 19 }, macroMode: 'percent' },
      '2026-11-12',
    ),
  ).toThrow('100');
  expect(() => validateGoal(draft, '2026-11-13')).toThrow('today');
  expect(() => validateGoal({ ...draft, accountId: 'other' }, '2026-11-12')).toThrow();
});
it('binds goal reads to the authenticated owner and requested effective date', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  expect(await personalRepository({ query }).getGoal({ id: 'owner' }, '2026-11-12')).toEqual({
    goal: null,
  });
  expect(query.mock.calls[0][1]).toEqual(['owner', '2026-11-12']);
});
it('replays a saved appearance once and rejects reuse for changed payload', async () => {
  const client = { release: vi.fn(), query: vi.fn() };
  const { createHash } = await import('node:crypto');
  const body = { mode: 'light', accent: 'blue', revision: 0, requestKey: key };
  const digest = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  client.query.mockImplementation(async (sql) => ({
    rows: sql.includes('SELECT request_digest')
      ? [{ request_digest: digest, response_body: { mode: 'light', accent: 'blue', revision: 1 } }]
      : [],
  }));
  const repo = personalRepository({ connect: async () => client });
  expect(await repo.saveAppearance({ id: 'owner' }, body)).toEqual({
    mode: 'light',
    accent: 'blue',
    revision: 1,
  });
  expect(client.query.mock.calls.some(([s]) => s.startsWith('INSERT'))).toBe(false);
  await expect(
    repo.saveAppearance({ id: 'owner' }, { ...body, accent: 'red' }),
  ).rejects.toMatchObject({ status: 409 });
  expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  expect(client.release).toHaveBeenCalledTimes(2);
});
