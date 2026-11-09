import { expect, it, vi } from 'vitest';
import { accountRepository } from './accounts.js';

function databaseFixture() {
  const client = { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() };
  return {
    client,
    database: {
      connect: vi.fn().mockResolvedValue(client),
      query: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
}
it('binds UUID ownership and textual identity subject separately to avoid PostgreSQL type conflicts', async () => {
  const { client, database } = databaseFixture();
  const id = '00000000-0000-4000-8000-000000000099';
  await accountRepository(database).createAccount({
    id,
    email: 'avery@example.test',
    displayName: 'Avery Fiction',
    timeZone: 'America/Denver',
    passwordHash: 'salted-hash',
  });
  expect(client.query).toHaveBeenCalledWith(
    expect.stringContaining('VALUES ($1, $2, $3, $4, $5)'),
    [id, 'nourishnet.local', id, 'Avery Fiction', 'America/Denver'],
  );
  expect(client.query.mock.calls.at(-1)).toEqual(['COMMIT']);
  expect(client.release).toHaveBeenCalled();
});
it('rolls back a duplicate email without leaving an orphan account', async () => {
  const { client, database } = databaseFixture();
  client.query.mockImplementation(async (sql) => {
    if (sql.startsWith('INSERT INTO account_credentials'))
      throw Object.assign(new Error('duplicate'), { code: '23505' });
    return { rows: [] };
  });
  expect(
    await accountRepository(database).createAccount({
      id: 'synthetic',
      email: 'avery@example.test',
      displayName: 'Avery',
      timeZone: 'America/Denver',
      passwordHash: 'hash',
    }),
  ).toBeNull();
  expect(client.query.mock.calls.at(-1)).toEqual(['ROLLBACK']);
  expect(client.release).toHaveBeenCalled();
});
it('limits session lookup to an unrevoked unexpired session for a verified account', async () => {
  const { database } = databaseFixture();
  const time = new Date();
  expect(await accountRepository(database).findSession('digest', time)).toBeNull();
  expect(database.query).toHaveBeenCalledWith(
    expect.stringMatching(
      /s.expires_at > \$2 AND s.revoked_at IS NULL AND c.verified_at IS NOT NULL/,
    ),
    ['digest', time],
  );
});
it('does not change passwords or revoke sessions when a recovery code is invalid', async () => {
  const { client, database } = databaseFixture();
  client.query.mockImplementation(async (sql) => ({
    rows: sql.startsWith('SELECT account_id') ? [{ account_id: 'owner' }] : [],
  }));
  expect(
    await accountRepository(database).consumeToken(
      'avery@example.test',
      'recover',
      'digest',
      new Date(),
      'new-hash',
    ),
  ).toBe(false);
  expect(client.query).not.toHaveBeenCalledWith(
    expect.stringContaining('SET password_hash'),
    expect.anything(),
  );
  expect(client.query).not.toHaveBeenCalledWith(
    expect.stringContaining('SET revoked_at'),
    expect.anything(),
  );
});
it('consumes a valid recovery code, changes the hash and revokes owner sessions in one transaction', async () => {
  const { client, database } = databaseFixture();
  const time = new Date();
  client.query.mockImplementation(async (sql) => ({
    rows:
      sql.startsWith('SELECT account_id') || sql.startsWith('UPDATE account_tokens')
        ? [{ account_id: 'owner' }]
        : [],
  }));
  expect(
    await accountRepository(database).consumeToken(
      'avery@example.test',
      'recover',
      'digest',
      time,
      'new-hash',
    ),
  ).toBe(true);
  expect(client.query).toHaveBeenCalledWith(
    'UPDATE account_credentials SET password_hash = $1 WHERE account_id = $2',
    ['new-hash', 'owner'],
  );
  expect(client.query).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE account_sessions SET revoked_at'),
    [time, 'owner'],
  );
  expect(client.query.mock.calls.at(-1)).toEqual(['COMMIT']);
});
