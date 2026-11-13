import { beforeEach, expect, it, vi } from 'vitest';
import { hostedPhotoStore } from './hostedPhotos.js';
const account = '11111111-1111-4111-8111-111111111111',
  submission = '22222222-2222-4222-8222-222222222222';
let database, client, store;
beforeEach(() => {
  client = {
    query: vi.fn(async (sql) => ({ rows: sql.includes('SUM') ? [{ bytes: 0 }] : [] })),
    release: vi.fn(),
  };
  database = {
    connect: vi.fn(async () => client),
    query: vi.fn(async () => ({ rows: [{ contents: Buffer.from('private') }] })),
  };
  store = hostedPhotoStore(database);
});
it('serializes budget checks and stores private photo bytes using parameters and generated keys', async () => {
  const bytes = Buffer.from([255, 216, 255]);
  const key = await store.save(account, submission, { bytes, mime: 'image/jpeg' });
  expect(key).toMatch(new RegExp('^' + account + '/' + submission + '/[a-f0-9-]+.jpg$'));
  const insert = client.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO'));
  expect(insert[1]).toEqual([
    key,
    account,
    submission,
    'image/jpeg',
    3,
    expect.stringMatching(/^[a-f0-9]{64}$/),
    bytes,
  ]);
  expect(
    client.query.mock.calls.map(([sql]) =>
      sql.includes('advisory')
        ? 'LOCK'
        : sql.includes('SUM')
          ? 'SUM'
          : sql.includes('INSERT')
            ? 'INSERT'
            : sql,
    ),
  ).toEqual(['BEGIN', 'LOCK', 'SUM', 'INSERT', 'COMMIT']);
  expect(client.release).toHaveBeenCalledOnce();
  expect(await store.read(key)).toEqual(Buffer.from('private'));
  expect(database.query).toHaveBeenCalledWith(expect.stringContaining('account_id=$2'), [
    key,
    account,
  ]);
  await store.discard([key]);
  expect(database.query).toHaveBeenLastCalledWith(expect.stringContaining('DELETE'), [
    key,
    account,
  ]);
});
it('rejects excessive sizes before a connection, and rolls back a full storage budget', async () => {
  await expect(
    store.save(account, submission, { bytes: Buffer.alloc(2097153), mime: 'image/jpeg' }),
  ).rejects.toMatchObject({ status: 413 });
  expect(database.connect).not.toHaveBeenCalled();
  store = hostedPhotoStore(database, { budgetBytes: 2 });
  await expect(
    store.save(account, submission, { bytes: Buffer.from('abc'), mime: 'image/png' }),
  ).rejects.toMatchObject({ status: 507 });
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.release).toHaveBeenCalled();
  expect(client.query.mock.calls.some(([sql]) => sql.includes('INSERT'))).toBe(false);
});
it('rejects arbitrary storage paths and unapproved caps without querying', async () => {
  await expect(store.read('../secret')).rejects.toThrow();
  await expect(store.discard(['https://external.test/photo'])).rejects.toThrow();
  expect(database.query).not.toHaveBeenCalled();
  expect(() => hostedPhotoStore(database, { budgetBytes: 104857601 })).toThrow();
});
it('does not delete a photo after an ambiguous commit or expose a missing photo', async () => {
  client.query.mockImplementation(async (sql) => {
    if (sql === 'COMMIT') throw new Error('lost response');
    return { rows: sql.includes('SUM') ? [{ bytes: 0 }] : [] };
  });
  await expect(
    store.save(account, submission, { bytes: Buffer.from('abc'), mime: 'image/png' }),
  ).rejects.toThrow('lost response');
  expect(database.query).not.toHaveBeenCalled();
  database.query.mockResolvedValue({ rows: [] });
  await expect(
    store.read(account + '/' + submission + '/33333333-3333-4333-8333-333333333333.png'),
  ).rejects.toMatchObject({ status: 404 });
});
