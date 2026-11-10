import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { diaryDraft, diaryRepository } from './diary.js';

const account = { id: '10000000-0000-4000-8000-000000000001', timeZone: 'America/Denver' };
const draft = {
  date: '2026-11-01',
  meal: 'breakfast',
  quantity: 1.5,
  servingId: '20000000-0000-4000-8000-000000000001',
  requestKey: '30000000-0000-4000-8000-000000000001',
};
const row = {
  id: 'entry',
  time_zone: account.timeZone,
  source_serving_id: draft.servingId,
  catalog_version: 1,
  meal: 'breakfast',
  quantity: '1.5000',
  food_name: 'Sample oats',
  serving_label: '40 g dry',
  serving_grams: '40.0000',
  calories_kcal: '150.0000',
  protein_g: '5.5000',
  fat_g: '0.0000',
  carbohydrates_g: '27.0000',
  sodium_mg: null,
};
function transaction({ prior = [], missing = false, failure = false } = {}) {
  const client = {
    release: vi.fn(),
    query: vi.fn(async (sql, values) => {
      if (sql.includes('SELECT request_digest')) return { rows: prior };
      if (sql.includes('FROM food_servings'))
        return {
          rows: missing
            ? []
            : [
                {
                  ...row,
                  name: row.food_name,
                  version: 1,
                  label: row.serving_label,
                  grams: row.serving_grams,
                },
              ],
        };
      if (sql.includes('INSERT INTO diary_days')) return { rows: [{ id: 'day' }] };
      if (sql.includes('INSERT INTO diary_entries')) {
        if (failure) throw new Error('database failure');
        return { rows: [{ ...row, quantity: String(values[5]) }] };
      }
      return { rows: [] };
    }),
  };
  return { client, database: { connect: vi.fn().mockResolvedValue(client) } };
}
it('scales decimal servings and aggregates multiple meals without treating unknown sodium as zero', async () => {
  const database = {
    query: vi.fn().mockResolvedValue({
      rows: [row, { ...row, id: 'other', meal: 'lunch', quantity: '0.1000', sodium_mg: '0.0000' }],
    }),
  };
  const diary = await diaryRepository(database).get(account, draft.date);
  expect(diary.totals).toEqual({
    calories: 240,
    protein: 8.8,
    fat: 0,
    carbohydrates: 43.2,
    sodium: null,
  });
  expect(diary.meals[0].totals.calories).toBe(225);
  expect(diary.meals[1].totals.sodium).toBe(0);
  expect(diary.meals[0].entries[0]).toMatchObject({
    quantity: 1.5,
    servingBasis: '40 g dry',
    nutrients: { calories: 150 },
    contribution: { calories: 225, protein: 8.25, sodium: null },
  });
  const [sql, values] = database.query.mock.calls[0];
  expect(values).toEqual([account.id, draft.date]);
  expect(sql).toContain('d.account_id = $1 AND d.local_date = $2::date');
  expect(sql).not.toContain('JOIN food_servings');
});
it('retains all eight decimal places in products and sums', async () => {
  const database = {
    query: vi.fn().mockResolvedValue({
      rows: [
        { ...row, calories_kcal: '0.0001', quantity: '0.0001' },
        { ...row, calories_kcal: '0.1000', quantity: '0.2000' },
      ],
    }),
  };
  expect((await diaryRepository(database).get(account, draft.date)).totals.calories).toBe(
    0.02000001,
  );
});
it.each([{ rows: [] }, { rows: [{ time_zone: 'Pacific/Auckland', id: null }] }])(
  'returns zero totals for empty days',
  async ({ rows }) => {
    const database = { query: vi.fn().mockResolvedValue({ rows }) };
    const result = await diaryRepository(database).get(account, '2024-02-29');
    expect(result.totals).toEqual({ calories: 0, protein: 0, fat: 0, carbohydrates: 0, sodium: 0 });
    expect(result.meals).toHaveLength(4);
    expect(result.meals.every((meal) => meal.entries.length === 0)).toBe(true);
    expect(result.timeZone).toBe(rows.length ? 'Pacific/Auckland' : account.timeZone);
  },
);
it.each(['2026-12-31', '2027-01-01', '2026-03-08', '2026-11-01', '2024-02-29'])(
  'passes local day %s unchanged rather than converting it to UTC',
  async (date) => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const result = await diaryRepository(database).get(
      { ...account, timeZone: 'Pacific/Kiritimati' },
      date,
    );
    expect(result.date).toBe(date);
    expect(database.query.mock.calls[0][1]).toEqual([account.id, date]);
  },
);
it.each(['2026-02-29', '2026-11-01T00:00:00Z', '0000-01-01', null, "2026-11-01' OR true"])(
  'rejects invalid local day %j before querying',
  async (date) => {
    const database = { query: vi.fn() };
    await expect(diaryRepository(database).get(account, date)).rejects.toMatchObject({
      status: 400,
    });
    expect(database.query).not.toHaveBeenCalled();
  },
);
it.each([
  { quantity: 0 },
  { quantity: -1 },
  { quantity: '1' },
  { quantity: Infinity },
  { quantity: NaN },
  { quantity: 1.00001 },
  { quantity: 100000000 },
  { meal: 'brunch' },
  { servingId: 'bad' },
  { requestKey: null },
  { accountId: 'another-owner' },
  { date: '2026-02-30' },
  { nutrients: { calories: 0 } },
])('rejects malformed or caller-owned fields %j', (change) => {
  expect(() => diaryDraft({ ...draft, ...change })).toThrow();
});
it('saves a catalog snapshot, session ownership and local timezone atomically', async () => {
  const { client, database } = transaction();
  const saved = await diaryRepository(database).create(account, draft);
  expect(saved.entry.contribution.calories).toBe(225);
  const calls = client.query.mock.calls;
  expect(calls[0][0]).toBe('BEGIN');
  expect(calls.find(([sql]) => sql.includes('INSERT INTO diary_days'))[1].slice(1)).toEqual([
    account.id,
    draft.date,
    account.timeZone,
  ]);
  expect(calls.find(([sql]) => sql.includes('INSERT INTO diary_entries'))[1].slice(2)).toEqual([
    draft.servingId,
    1,
    draft.meal,
    1.5,
    'Sample oats',
    '40 g dry',
    '40.0000',
    '150.0000',
    '5.5000',
    '0.0000',
    '27.0000',
    null,
  ]);
  expect(calls.at(-1)[0]).toBe('COMMIT');
  expect(client.release).toHaveBeenCalledOnce();
});
it('replays an actor-scoped retry without accessing the corrected catalog or inserting another entry', async () => {
  const body = { date: draft.date, entry: { id: 'saved' } };
  const request_digest = createHash('sha256')
    .update(JSON.stringify([draft.date, draft.servingId, draft.quantity, draft.meal]))
    .digest('hex');
  const { database, client } = transaction({ prior: [{ request_digest, response_body: body }] });
  expect(await diaryRepository(database).create(account, draft)).toEqual(body);
  expect(client.query.mock.calls.some(([sql]) => sql.includes('INSERT INTO diary_entries'))).toBe(
    false,
  );
  expect(client.query.mock.calls.find(([sql]) => sql.includes('SELECT request_digest'))[1]).toEqual(
    [account.id, draft.requestKey],
  );
});
it('rejects reuse of a save key with a changed payload', async () => {
  const { database, client } = transaction({ prior: [{ request_digest: 'different' }] });
  await expect(diaryRepository(database).create(account, draft)).rejects.toMatchObject({
    status: 409,
  });
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.release).toHaveBeenCalledOnce();
});
it.each([{ missing: true }, { failure: true }])(
  'rolls back failed saves and releases the connection',
  async (options) => {
    const { database, client } = transaction(options);
    await expect(diaryRepository(database).create(account, draft)).rejects.toThrow();
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(
      client.query.mock.calls.some(([sql]) => sql.includes('INSERT INTO write_requests')),
    ).toBe(false);
    expect(client.release).toHaveBeenCalledOnce();
  },
);
