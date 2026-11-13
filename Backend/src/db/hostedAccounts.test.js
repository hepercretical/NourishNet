import { expect, it, vi } from 'vitest';
import { hostedAccountRepository } from './hostedAccounts.js';
it('looks up the verified issuer and subject using bound parameters', async () => {
  const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
  expect(
    await hostedAccountRepository(database).find({ issuer: 'issuer', subject: 'actor' }),
  ).toBeNull();
  expect(database.query).toHaveBeenCalledWith(expect.stringContaining('hosted_account_profiles'), [
    'issuer',
    'actor',
  ]);
});
it('rejects missing adulthood, invalid timezone and browser-supplied ownership IDs before SQL', async () => {
  const database = { connect: vi.fn() };
  const repo = hostedAccountRepository(database);
  const body = { adult: true, displayName: 'Test', timeZone: 'America/Denver' };
  for (const draft of [
    { ...body, adult: false },
    { ...body, timeZone: 'invalid' },
    { ...body, accountId: 'other' },
  ])
    await expect(repo.onboard({ issuer: 'issuer', subject: 'actor' }, draft)).rejects.toThrow();
  expect(database.connect).not.toHaveBeenCalled();
});
it('creates one stable identity mapping and commits adult confirmation together', async () => {
  const client = {
    query: vi.fn().mockImplementation(async (sql) => ({
      rows: sql.startsWith('INSERT INTO accounts')
        ? [{ id: 'owner', display_name: 'Fiction', time_zone: 'UTC' }]
        : [],
    })),
    release: vi.fn(),
  };
  const database = { connect: vi.fn().mockResolvedValue(client) };
  const result = await hostedAccountRepository(database).onboard(
    { issuer: 'issuer', subject: 'actor' },
    { adult: true, displayName: 'Fiction', timeZone: 'UTC' },
  );
  expect(result).toEqual({ id: 'owner', displayName: 'Fiction', timeZone: 'UTC', sharing: false });
  expect(client.query).toHaveBeenCalledWith(
    expect.stringContaining('ON CONFLICT (identity_issuer, identity_subject)'),
    [expect.any(String), 'issuer', 'actor', 'Fiction', 'UTC'],
  );
  expect(client.query.mock.calls.at(-1)).toEqual(['COMMIT']);
  expect(client.release).toHaveBeenCalled();
});
