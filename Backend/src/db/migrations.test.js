import { describe, expect, it, vi } from 'vitest';
import { applyMigration, loadMigration, migrationBody } from './migrations.js';

function fakeClient({ existing = [], fail = false } = {}) {
  return {
    query: vi.fn(async (sql) => {
      if (sql.startsWith('SELECT checksum')) return { rows: existing };
      if (sql === 'CREATE TABLE example (id integer);' && fail)
        throw new Error('synthetic failure');
      return { rows: [] };
    }),
  };
}
const migration = {
  name: '001_identity_catalog.sql',
  checksum: 'example-checksum',
  sql: 'BEGIN;\nCREATE TABLE example (id integer);\nCOMMIT;',
};

describe('explicit development migrations', () => {
  it('records a migration and its checksum in the same committed transaction', async () => {
    const client = fakeClient();
    expect(await applyMigration(client, migration)).toBe('applied');
    expect(client.query).toHaveBeenCalledWith(
      'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
      [migration.name, migration.checksum],
    );
    expect(client.query.mock.calls.at(-1)).toEqual(['COMMIT']);
  });
  it('does not reapply a migration with the same checksum', async () => {
    const client = fakeClient({ existing: [{ checksum: migration.checksum }] });
    expect(await applyMigration(client, migration)).toBe('already-applied');
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE example'));
  });
  it('rolls back checksum drift', async () => {
    const client = fakeClient({ existing: [{ checksum: 'different' }] });
    await expect(applyMigration(client, migration)).rejects.toThrow('checksum mismatch');
    expect(client.query.mock.calls.at(-1)).toEqual(['ROLLBACK']);
  });
  it('rolls back a failed migration and does not record it', async () => {
    const client = fakeClient();
    client.query.mockImplementation(async (sql) => {
      if (sql.includes('CREATE TABLE example')) throw new Error('synthetic failure');
      return { rows: [] };
    });
    await expect(applyMigration(client, migration)).rejects.toThrow('synthetic failure');
    expect(client.query.mock.calls.at(-1)).toEqual(['ROLLBACK']);
    expect(client.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO schema_migrations'),
      expect.anything(),
    );
  });
  it('requires the foundation before a feature migration', async () => {
    const client = fakeClient();
    await expect(applyMigration(client, { ...migration, name: '002_diary.sql' })).rejects.toThrow(
      'foundation',
    );
    expect(client.query.mock.calls.at(-1)).toEqual(['ROLLBACK']);
  });
  it('rejects path traversal before reading a migration', async () => {
    await expect(loadMigration('../../.env')).rejects.toThrow('known approved');
  });
  it('loads all approved migration designs with one outer transaction and a checksum', async () => {
    const migration = await loadMigration('001_identity_catalog.sql');
    expect(migration.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(migrationBody(migration.sql)).not.toMatch(/^BEGIN;|^COMMIT;/m);
  });
});
