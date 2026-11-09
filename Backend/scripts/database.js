import { createDatabase } from '../src/db/client.js';
import { readFile } from 'node:fs/promises';
import { requireSyntheticDevelopment } from '../src/db/config.js';
import { applyMigration, loadMigration, migrationBody } from '../src/db/migrations.js';

const [action, name] = process.argv.slice(2);
let database;
let client;
try {
  if (!['check', 'migrate', 'seed'].includes(action)) throw new Error('Unknown database command.');
  const migration = action === 'migrate' ? await loadMigration(name) : null;
  requireSyntheticDevelopment();
  database = createDatabase();
  client = await database.connect();
  if (migration) {
    const outcome = await applyMigration(client, migration);
    console.info(`Migration ${migration.name}: ${outcome}.`);
  } else if (action === 'seed') {
    // Explicit development command only; never called from application startup.
    const seed = await readFile(new URL('../seeds/synthetic.sql', import.meta.url), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query('SELECT pg_advisory_xact_lock($1)', [2026110902]);
      await client.query(migrationBody(seed));
      await client.query('COMMIT');
      console.info(
        'Synthetic development fixtures seeded. Repeated seeding fails without overwriting data.',
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } else {
    await client.query('SELECT 1');
    console.info('Development database connection verified.');
  }
} catch {
  console.error(
    'Database command failed. Check the approved target, configuration, and migration order.',
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await database?.end();
}
