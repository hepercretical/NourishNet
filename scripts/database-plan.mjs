import { loadMigration } from '../Backend/src/db/migrations.js';

// Print an exact review manifest; never connect, seed, or apply SQL.
try {
  const names = process.argv.slice(2);
  if (!names.length || new Set(names).size !== names.length) throw new Error();
  const migrations = [];
  for (const name of names) {
    const migration = await loadMigration(name);
    migrations.push({ name: migration.name, sha256: migration.checksum });
  }
  console.info(
    JSON.stringify(
      {
        migrations,
        applied: false,
        notice:
          'Compare with target migration history, review SQL and budget, then obtain human approval before applying.',
      },
      null,
      2,
    ),
  );
} catch {
  console.error(
    'Select unique registered migration filenames for review. No database changes were made.',
  );
  process.exitCode = 1;
}
