import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createDatabase } from '../src/db/client.js';
import { requireSyntheticDevelopment } from '../src/db/config.js';
import { importLocalCatalog, sha256, validateCatalog } from '../src/db/localCatalog.js';

// Separately approved hosted catalog release only. Never run from builds/startup.
const [file, expectedHost, catalogName, approvedChecksum, ...extra] = process.argv.slice(2);
let database, client;
try {
  if (
    !file ||
    !expectedHost?.endsWith('.neon.tech') ||
    expectedHost.includes('-pooler') ||
    !/^[a-z0-9-]+\.json$/.test(catalogName || '') ||
    extra.length
  )
    throw new Error();
  const text = await readFile(new URL(`../catalog/${catalogName}`, import.meta.url), 'utf8');
  if (sha256(text) !== approvedChecksum) throw new Error();
  const catalog = validateCatalog(JSON.parse(text));
  const env = parseEnv(await readFile(file, 'utf8'));
  const direct = new URL(env.DATABASE_URL_UNPOOLED);
  if (direct.hostname !== expectedHost || direct.pathname !== '/neondb') throw new Error();
  const configured = {
    ...env,
    DATABASE_URL: direct.href,
    DATABASE_EXPECTED_HOST: expectedHost,
    DATABASE_EXPECTED_NAME: 'neondb',
  };
  requireSyntheticDevelopment(configured);
  database = createDatabase(configured);
  client = await database.connect();
  const names = (await client.query('SELECT name FROM schema_migrations')).rows.map(
    (row) => row.name,
  );
  if (
    !['001_identity_catalog.sql', '002_diary.sql', '008_actual_food_catalog.sql'].every((name) =>
      names.includes(name),
    )
  )
    throw new Error();
  const count = await importLocalCatalog(client, catalog);
  console.info(`Added ${count} reviewed hosted food record(s). Existing records were preserved.`);
} catch {
  console.error(
    'Hosted catalog release stopped. Check the approved target, checksum, prerequisites and catalog collisions. Private diagnostics withheld.',
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await database?.end();
}
