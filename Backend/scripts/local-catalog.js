import { readFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import { applyMigration, loadMigration } from '../src/db/migrations.js';
import {
  importLocalCatalog,
  requireLocalCatalogTarget,
  sha256,
  validateCatalog,
} from '../src/db/localCatalog.js';

const [action, migrationApproval, catalogApproval, ...extra] = process.argv.slice(2);
let database;
let client;
try {
  if (!['plan', 'inspect', 'apply'].includes(action) || extra.length)
    throw new Error('Choose plan, inspect, or an explicitly approved apply.');
  const migration = await loadMigration('008_actual_food_catalog.sql');
  const text = await readFile(
    new URL('../catalog/manufacturer-foods.json', import.meta.url),
    'utf8',
  );
  const catalog = validateCatalog(JSON.parse(text));
  const checksum = sha256(text);
  if (action === 'plan') {
    if (migrationApproval || catalogApproval)
      throw new Error('Plan does not accept approval flags.');
    console.info(
      JSON.stringify(
        {
          status: 'proposal-only; human approval required before apply',
          target: '127.0.0.1:55432/nourishnet_plan02_dev',
          migration: { name: migration.name, sha256: migration.checksum },
          catalog: { file: 'Backend/catalog/manufacturer-foods.json', sha256: checksum },
          foods: catalog.foods,
          effect: 'Retire synthetic catalog foods without deletion; add three actual food records.',
          remoteOperations: 'None. inspect/apply reject every hosted target.',
        },
        null,
        2,
      ),
    );
  } else {
    // Reject all remote targets before creating a pg Pool or issuing a query.
    requireLocalCatalogTarget();
    if (
      action === 'apply' &&
      (migrationApproval !== migration.checksum || catalogApproval !== checksum)
    )
      throw new Error('Both exact human-approved checksums are required.');
    if (action === 'inspect' && (migrationApproval || catalogApproval))
      throw new Error('Inspect does not accept approval flags.');
    database = createDatabase();
    client = await database.connect();
    const history = await client.query(
      'SELECT name, checksum FROM schema_migrations ORDER BY name',
    );
    for (const required of ['001_identity_catalog.sql', '002_diary.sql', '006_local_accounts.sql'])
      if (!history.rows.some((row) => row.name === required))
        throw new Error('Complete the existing local identity/diary prerequisites first.');
    if (action === 'inspect') {
      const counts = await client.query(
        'SELECT provenance, count(*)::int AS count FROM foods GROUP BY provenance ORDER BY provenance',
      );
      const entries = await client.query('SELECT count(*)::int AS count FROM diary_entries');
      console.info(
        JSON.stringify({
          target: 'local loopback development only',
          migrations: history.rows,
          foodsByProvenance: counts.rows,
          diaryEntryCount: entries.rows[0].count,
          writes: false,
        }),
      );
    } else {
      const outcome = await applyMigration(client, migration);
      console.info(`Local migration ${migration.name}: ${outcome}.`);
      const count = await importLocalCatalog(client, catalog);
      console.info(`Imported ${count} actual local foods. No accounts or diary entries created.`);
    }
  }
} catch {
  console.error(
    'Local catalog command stopped. Review target, approvals, catalog conflicts and migration prerequisites. No private diagnostics printed.',
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await database?.end();
}
