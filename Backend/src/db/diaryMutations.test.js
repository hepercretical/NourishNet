import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { mutationDraft } from './diaryMutations.js';
import { diaryRepository } from './diary.js';
const id = '20000000-0000-4000-8000-000000000001';
const account = { id: 'owner' };
const draft = {
  date: '2026-11-09',
  quantity: 0.25,
  meal: 'lunch',
  revision: 1,
  requestKey: '30000000-0000-4000-8000-000000000001',
};
const row = {
  id,
  day_id: 'day',
  revision: 1,
  quantity: '1.5',
  meal: 'breakfast',
  food_name: 'Snapshot oats',
  serving_label: '40 g',
  serving_grams: '40',
  source_serving_id: id,
  catalog_version: 1,
  calories_kcal: '150',
  protein_g: '5',
  fat_g: '0',
  carbohydrates_g: '27',
  sodium_mg: null,
};
function setup({ prior = [], found = [row], failure = false } = {}) {
  const client = {
    release: vi.fn(),
    query: vi.fn(async (sql, values) => {
      if (sql.includes('SELECT request_digest')) return { rows: prior };
      if (sql.includes('SELECT e.*')) return { rows: found };
      if (sql.includes('UPDATE diary_entries')) {
        if (failure) throw new Error('private failure');
        return { rows: [{ ...row, quantity: String(values[0]), meal: values[1], revision: 2 }] };
      }
      return { rows: [] };
    }),
  };
  return { client, repository: diaryRepository({ connect: vi.fn().mockResolvedValue(client) }) };
}
it('updates amount and meal using saved nutrition, ownership and revision', async () => {
  const { client, repository } = setup();
  expect(await repository.update(account, id, draft)).toMatchObject({
    date: draft.date,
    entry: {
      revision: 2,
      quantity: 0.25,
      meal: 'lunch',
      foodName: 'Snapshot oats',
      contribution: { calories: 37.5, sodium: null },
    },
  });
  const calls = client.query.mock.calls;
  expect(calls.find(([sql]) => sql.includes('SELECT e.*'))[1]).toEqual([
    id,
    account.id,
    draft.date,
  ]);
  const sql = calls.find(([sql]) => sql.includes('UPDATE diary_entries'))[0];
  expect(sql).not.toMatch(/food_name|calories_kcal|source_serving_id/);
  expect(calls.some(([sql]) => sql.includes('food_servings'))).toBe(false);
  expect(calls.at(-1)[0]).toBe('COMMIT');
  expect(client.release).toHaveBeenCalledOnce();
});
it('removes only the selected owned entry and increments the day revision', async () => {
  const { client, repository } = setup();
  const body = { date: draft.date, revision: draft.revision, requestKey: draft.requestKey };
  expect(await repository.remove(account, id, body)).toEqual({ date: body.date, removedId: id });
  expect(client.query).toHaveBeenCalledWith(
    'DELETE FROM diary_entries WHERE id = $1 AND day_id = $2',
    [id, 'day'],
  );
  expect(client.query).toHaveBeenCalledWith(
    'UPDATE diary_days SET revision = revision + 1 WHERE id = $1',
    ['day'],
  );
});
it.each([
  { found: [], status: 404 },
  { found: [{ ...row, revision: 2 }], status: 409 },
  { failure: true },
])('rolls back unavailable, stale and failed writes', async ({ status, ...options }) => {
  const { client, repository } = setup(options);
  if (status) await expect(repository.update(account, id, draft)).rejects.toMatchObject({ status });
  else await expect(repository.update(account, id, draft)).rejects.toThrow();
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.query.mock.calls.some(([sql]) => sql.includes('INSERT INTO write_requests'))).toBe(
    false,
  );
  expect(client.release).toHaveBeenCalledOnce();
});
it.each([false, true])(
  'replays an identical request after a lost response, including removal (%s)',
  async (remove) => {
    const response_body = { date: draft.date, replayed: true };
    const request_digest = createHash('sha256')
      .update(
        JSON.stringify([
          id,
          draft.date,
          draft.revision,
          ...(remove ? [] : [draft.quantity, draft.meal]),
        ]),
      )
      .digest('hex');
    const { client, repository } = setup({ prior: [{ request_digest, response_body }] });
    const body = { date: draft.date, revision: draft.revision, requestKey: draft.requestKey };
    expect(
      await repository[remove ? 'remove' : 'update'](account, id, remove ? body : draft),
    ).toEqual(response_body);
    expect(
      client.query.mock.calls.some(([sql]) => /UPDATE diary|DELETE FROM diary/.test(sql)),
    ).toBe(false);
    expect(
      client.query.mock.calls.find(([sql]) => sql.includes('SELECT request_digest'))[1],
    ).toEqual([account.id, remove ? 'diary.remove' : 'diary.update', draft.requestKey]);
  },
);
it('rejects a changed payload with an existing request key', async () => {
  const { repository } = setup({ prior: [{ request_digest: 'different' }] });
  await expect(repository.update(account, id, draft)).rejects.toMatchObject({ status: 409 });
});
it.each([
  { quantity: 0 },
  { quantity: 1.00001 },
  { quantity: 100000000 },
  { quantity: '1' },
  { meal: 'other' },
  { revision: 0 },
  { revision: 1.5 },
  { requestKey: 'bad' },
  { date: '2026-02-30' },
  { accountId: 'forged' },
  { nutrients: {} },
])('rejects invalid or forged mutation input %j', (change) => {
  expect(() => mutationDraft(id, { ...draft, ...change })).toThrow();
});
it('rejects malformed entry ids and removal fields', () => {
  expect(() => mutationDraft('bad', draft)).toThrow();
  expect(() => mutationDraft(id, draft, true)).toThrow();
});
