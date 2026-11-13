import { readFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import {
  importLocalCatalog,
  requireLocalCatalogTarget,
  sha256,
  validateCatalog,
} from '../src/db/localCatalog.js';

// Explicit manual catalog addition only. Never migrate, overwrite, seed or call a provider.
const [name, approval, ...extra] = process.argv.slice(2);
let database, client;
try {
  if (typeof name !== 'string' || !/^[a-z0-9-]+\.json$/.test(name) || extra.length)
    throw new Error('Choose a catalog JSON filename, with no directory traversal.');
  const bytes = await readFile(new URL(`../catalog/${name}`, import.meta.url), 'utf8');
  const catalog = validateCatalog(JSON.parse(bytes));
  const checksum = sha256(bytes);
  if (!approval) {
    console.info(
      JSON.stringify(
        {
          status: 'proposal only; no connection or writes',
          file: name,
          sha256: checksum,
          foods: catalog.foods,
        },
        null,
        2,
      ),
    );
  } else {
    if (approval !== checksum) throw new Error('Exact reviewed checksum required.');
    requireLocalCatalogTarget();
    database = createDatabase();
    client = await database.connect();
    const history = (await client.query('SELECT name FROM schema_migrations')).rows;
    for (const required of [
      '001_identity_catalog.sql',
      '002_diary.sql',
      '008_actual_food_catalog.sql',
    ])
      if (!history.some((row) => row.name === required))
        throw new Error('Catalog prerequisites missing.');
    const count = await importLocalCatalog(client, catalog);
    console.info(
      `Added ${count} actual food record(s) to the approved local database. Existing records were not changed.`,
    );
  }
} catch {
  console.error(
    'Local food import stopped. Review filename, checksum, target and barcode collisions. No private diagnostics printed.',
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await database?.end();
}
