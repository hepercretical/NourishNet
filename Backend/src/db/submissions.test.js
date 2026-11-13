import { expect, it, vi } from 'vitest';
import { submissionRepository } from './submissions.js';
import { submissionDraft } from './submissionValidation.js';
const account = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
const photo = { mime: 'image/jpeg', data: Buffer.from([255, 216, 255, 0]).toString('base64') };
const draft = () => ({
  barcode: '030000010402',
  productName: '',
  servingBasis: '',
  nutrients: { calories: null, protein: null, fat: null, carbohydrates: null, sodium: null },
  front: photo,
  label: photo,
  requestKey: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
});
const row = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  gtin14: '00030000010402',
  product: {
    productName: '',
    servingBasis: '',
    nutrients: draft().nutrients,
    media: { front: { mime: 'image/jpeg' }, label: { mime: 'image/jpeg' } },
  },
  front_image_key: 'private-front',
  label_image_key: 'private-label',
  status: 'pending',
  revision: 1,
  created_at: new Date('2026-11-12T00:00:00Z'),
};
function setup({
  prior,
  known = false,
  duplicate = false,
  existing = { ...row, status: 'needs-review' },
  fail = false,
} = {}) {
  const client = {
    release: vi.fn(),
    query: vi.fn(async (sql, values) => {
      if (sql.startsWith('SELECT request_digest')) return { rows: prior ? [prior] : [] };
      if (sql.startsWith('SELECT id FROM foods')) return { rows: known ? [{ id: 'food' }] : [] };
      if (sql.startsWith('SELECT id FROM submissions'))
        return { rows: duplicate ? [{ id: 'existing' }] : [] };
      if (sql.startsWith('SELECT * FROM submissions')) return { rows: existing ? [existing] : [] };
      if (sql.startsWith('INSERT INTO submissions') || sql.startsWith('UPDATE submissions')) {
        if (fail) throw new Error('write unavailable');
        const product = JSON.parse(sql.startsWith('INSERT') ? values[5] : values[0]);
        return {
          rows: [
            {
              ...row,
              product,
              id: sql.startsWith('INSERT') ? values[0] : row.id,
              revision: sql.startsWith('UPDATE') ? 2 : 1,
            },
          ],
        };
      }
      return { rows: [] };
    }),
  };
  const database = {
    connect: vi.fn(async () => client),
    query: vi.fn(async () => ({ rows: [row] })),
  };
  const photos = {
    save: vi.fn(async () => 'new-private-key'),
    discard: vi.fn(),
    read: vi.fn(async () => Buffer.from('photo')),
  };
  return { client, database, photos, repository: submissionRepository(database, photos) };
}
it('stores a pending owned submission with images and replay response in one transaction, never catalog nutrition', async () => {
  const { repository, client, photos } = setup();
  const result = await repository.create(account, draft());
  expect(result.submission).toMatchObject({
    status: 'pending',
    barcode: '00030000010402',
    nutrients: { sodium: null },
    photos: { front: expect.stringContaining('/api/submissions/') },
  });
  expect(JSON.stringify(result)).not.toContain('private-key');
  expect(photos.save).toHaveBeenCalledTimes(2);
  const calls = client.query.mock.calls;
  expect(calls[0][0]).toBe('BEGIN');
  expect(calls.at(-1)[0]).toBe('COMMIT');
  expect(
    calls.some(
      ([sql]) => sql.startsWith('INSERT INTO foods') || sql.startsWith('INSERT INTO diary'),
    ),
  ).toBe(false);
  expect(calls.find(([sql]) => sql.startsWith('INSERT INTO submissions'))[1][1]).toBe(account.id);
});
it('replays the identical request without files or SQL inserts and rejects changed payloads', async () => {
  const input = draft(),
    response = { submission: { id: row.id, status: 'pending' } };
  const state = setup({
    prior: { request_digest: submissionDraft(input).digest, response_body: response },
  });
  expect(await state.repository.create(account, input)).toEqual(response);
  expect(state.photos.save).not.toHaveBeenCalled();
  await expect(
    state.repository.create(account, { ...input, productName: 'Changed' }),
  ).rejects.toMatchObject({ status: 409 });
});
it.each([{ known: true }, { duplicate: true }])(
  'does not write files for known catalog or duplicate pending products %j',
  async (options) => {
    const { repository, photos } = setup(options);
    await expect(repository.create(account, draft())).rejects.toMatchObject({ status: 409 });
    expect(photos.save).not.toHaveBeenCalled();
  },
);
it('rolls back SQL and discards only newly written files on insert failure', async () => {
  const { repository, client, photos } = setup({ fail: true });
  await expect(repository.create(account, draft())).rejects.toThrow('write unavailable');
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(photos.discard).toHaveBeenCalledWith(['new-private-key', 'new-private-key']);
  expect(client.release).toHaveBeenCalledOnce();
});
it('lets an owner correct requested fields, retaining existing photos, then returns to pending', async () => {
  const { repository, client, photos } = setup();
  const result = await repository.correct(account, row.id, {
    ...draft(),
    front: null,
    label: null,
    revision: 1,
    productName: 'Quaker Old Fashioned Oats',
  });
  expect(result.submission).toMatchObject({
    status: 'pending',
    revision: 2,
    productName: 'Quaker Old Fashioned Oats',
  });
  expect(photos.save).not.toHaveBeenCalled();
  const update = client.query.mock.calls.find(([sql]) => sql.startsWith('UPDATE submissions'));
  expect(update[1].slice(1)).toEqual(['private-front', 'private-label', row.id, account.id]);
});
it.each([
  { existing: null },
  { existing: { ...row, status: 'pending' } },
  { existing: { ...row, status: 'needs-review', revision: 2 } },
])('rejects unavailable, noncorrectable or stale correction %j', async (options) => {
  const { repository, photos } = setup(options);
  await expect(
    repository.correct(account, row.id, { ...draft(), revision: 1, front: null, label: null }),
  ).rejects.toThrow();
  expect(photos.save).not.toHaveBeenCalled();
});
it('bounds lists to the owner and never reveals storage keys; missing/other-owner detail/photo is 404', async () => {
  const { repository, database, photos } = setup();
  expect((await repository.list(account)).submissions[0].status).toBe('pending');
  expect(database.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 50'), [account.id]);
  await repository.get(account, row.id);
  expect(database.query.mock.calls.at(-1)[1]).toEqual([row.id, account.id]);
  database.query.mockResolvedValue({ rows: [] });
  await expect(repository.get(account, row.id)).rejects.toMatchObject({ status: 404 });
  await expect(repository.photo(account, row.id, 'front')).rejects.toMatchObject({ status: 404 });
  expect(photos.read).not.toHaveBeenCalled();
});
