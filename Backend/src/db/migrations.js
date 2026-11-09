import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const migrationNames = [
  '001_identity_catalog.sql',
  '002_diary.sql',
  '003_submissions.sql',
  '004_goals.sql',
  '005_connections.sql',
  '006_local_accounts.sql',
];

export async function loadMigration(name) {
  if (!migrationNames.includes(name))
    throw new Error('Select a known approved migration filename.');
  const sql = await readFile(new URL(`../../migrations/${name}`, import.meta.url), 'utf8');
  return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
}

export function migrationBody(sql) {
  // Reviewed files have one outer transaction; runner owns that transaction.
  if (
    (sql.match(/^BEGIN;\s*$/gm) ?? []).length !== 1 ||
    (sql.match(/^COMMIT;\s*$/gm) ?? []).length !== 1
  ) {
    throw new Error('Migration must contain exactly one outer transaction.');
  }
  return sql.replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '');
}

// Use one checked-out client, never pool.query for a multi-statement transaction.
export async function applyMigration(client, migration) {
  const body = migrationBody(migration.sql);
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock($1)', [2026110902]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const result = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [
      migration.name,
    ]);
    if (result.rows.length) {
      if (result.rows[0].checksum !== migration.checksum)
        throw new Error('Migration checksum mismatch.');
      await client.query('COMMIT');
      return 'already-applied';
    }
    const prior = migrationNames.slice(0, migrationNames.indexOf(migration.name));
    // Later independent features depend only on the shared foundation.
    if (prior.length) {
      const foundation = await client.query('SELECT name FROM schema_migrations WHERE name = $1', [
        migrationNames[0],
      ]);
      if (!foundation.rows.length) throw new Error('Apply the foundation migration first.');
    }
    await client.query(body);
    await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [
      migration.name,
      migration.checksum,
    ]);
    await client.query('COMMIT');
    return 'applied';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
