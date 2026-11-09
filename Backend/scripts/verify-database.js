import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import { requireSyntheticDevelopment } from '../src/db/config.js';
import { loadMigration, migrationBody, migrationNames } from '../src/db/migrations.js';

// Explicit manual integration verification, separate from mocked npm test.
// Later feature DDL and fixture data are ALWAYS rolled back, never applied.
let database;
let client;
let checks = 0;
async function reject(sql, values, code) {
  await client.query('SAVEPOINT expected_failure');
  let caught;
  try {
    await client.query(sql, values);
  } catch (error) {
    caught = error;
  }
  await client.query('ROLLBACK TO SAVEPOINT expected_failure');
  assert.equal(caught?.code, code);
  checks += 1;
}

try {
  requireSyntheticDevelopment();
  // This verification is approved only for our isolated local cluster.
  assert.equal(process.env.DATABASE_EXPECTED_HOST, '127.0.0.1');
  assert.equal(process.env.DATABASE_EXPECTED_NAME, 'nourishnet_plan02_dev');
  database = createDatabase();
  client = await database.connect();
  await client.query('BEGIN');
  await client.query('CREATE SCHEMA plan02_verification');
  await client.query('SET LOCAL search_path TO plan02_verification');
  for (const name of migrationNames) {
    await client.query(migrationBody((await loadMigration(name)).sql));
  }
  const seed = await readFile(new URL('../seeds/synthetic.sql', import.meta.url), 'utf8');
  await client.query(migrationBody(seed));
  checks += 1; // all five DDL designs and the synthetic fixture execute successfully
  const a = '00000000-0000-4000-8000-000000000001';
  const b = '00000000-0000-4000-8000-000000000002';
  const food = '10000000-0000-4000-8000-000000000001';
  const serving = '20000000-0000-4000-8000-000000000001';
  const day = '30000000-0000-4000-8000-000000000001';
  const entry = '40000000-0000-4000-8000-000000000001';
  const connection = '50000000-0000-4000-8000-000000000001';
  const missing = '90000000-0000-4000-8000-000000000001';

  await reject(
    'INSERT INTO accounts SELECT $1, identity_issuer, identity_subject, display_name, time_zone, created_at FROM accounts WHERE id = $2',
    [missing, a],
    '23505',
  );
  await reject(
    'INSERT INTO food_servings (id, food_id, label, calories_kcal, protein_g, fat_g, carbohydrates_g) VALUES ($1, $2, $3, 1, 1, 1, 1)',
    [missing, missing, 'orphan'],
    '23503',
  );
  for (const amount of [-1, 'NaN', 100000000]) {
    await reject(
      'UPDATE food_servings SET calories_kcal = $1 WHERE id = $2',
      [amount, serving],
      amount === 100000000 ? '22003' : '23514',
    );
  }
  await reject('UPDATE food_servings SET calories_kcal = NULL WHERE id = $1', [serving], '23502');
  await client.query('INSERT INTO food_barcodes (gtin14, food_id) VALUES ($1, $2)', [
    '00000000000000',
    food,
  ]);
  await reject(
    'INSERT INTO food_barcodes (gtin14, food_id) VALUES ($1, $2)',
    ['00000000000000', food],
    '23505',
  );
  await client.query(
    'INSERT INTO diary_days (id, account_id, local_date, time_zone) VALUES ($1, $2, $3, $4)',
    [day, a, '2028-02-29', 'America/Denver'],
  );
  await client.query(
    `INSERT INTO diary_entries (id, day_id, source_serving_id, catalog_version, meal, quantity, food_name, serving_label, serving_grams, calories_kcal, protein_g, fat_g, carbohydrates_g, sodium_mg)
    SELECT $1, $2, s.id, f.version, 'breakfast', 1.5, f.name, s.label, s.grams, s.calories_kcal, s.protein_g, s.fat_g, s.carbohydrates_g, s.sodium_mg
    FROM food_servings s JOIN foods f ON f.id = s.food_id WHERE s.id = $3`,
    [entry, day, serving],
  );
  assert.equal(
    (
      await client.query(
        'SELECT quantity * calories_kcal AS total FROM diary_entries WHERE id = $1',
        [entry],
      )
    ).rows[0].total,
    '150.00000000',
  );
  checks += 1;
  for (const quantity of [0, -1])
    await reject(
      'UPDATE diary_entries SET quantity = $1 WHERE id = $2',
      [quantity, entry],
      '23514',
    );
  await reject('UPDATE diary_entries SET meal = $1 WHERE id = $2', ['brunch', entry], '23514');
  await reject('UPDATE diary_entries SET day_id = $1 WHERE id = $2', [missing, entry], '23503');
  await client.query('UPDATE food_servings SET calories_kcal = 200 WHERE id = $1', [serving]);
  assert.equal(
    (await client.query('SELECT calories_kcal FROM diary_entries WHERE id = $1', [entry])).rows[0]
      .calories_kcal,
    '100.0000',
  );
  assert.equal(
    (await client.query('SELECT id FROM diary_days WHERE account_id = $1', [b])).rows.length,
    0,
  );
  assert.equal(
    (await client.query('SELECT sodium_mg FROM food_servings WHERE id <> $1', [serving])).rows[0]
      .sodium_mg,
    null,
  );
  checks += 3;
  await client.query(
    'INSERT INTO connections (id, account_low, account_high, requested_by) VALUES ($1, $2, $3, $2)',
    [connection, a, b],
  );
  assert.equal((await client.query('SELECT * FROM connection_sharing')).rows.length, 0);
  checks += 1;
  await reject(
    'INSERT INTO connections (id, account_low, account_high, requested_by) VALUES ($1, $2, $3, $2)',
    [missing, b, a],
    '23514',
  );
  await reject(
    'INSERT INTO connection_sharing (connection_id, account_low, account_high, shared_by, progress_field) VALUES ($1, $2, $3, $4, $5)',
    [connection, a, b, missing, 'calories'],
    '23514',
  );
  await reject('UPDATE connections SET status = $1 WHERE id = $2', ['public', connection], '23514');
  await reject('INSERT INTO account_blocks (blocker_id, blocked_id) VALUES ($1, $1)', [a], '23514');
  await client.query(
    `INSERT INTO submissions (id, account_id, gtin14, front_image_key, label_image_key, product)
    VALUES ($1, $2, '00000000000000', 'samples/front.png', 'samples/label.png', '{}')`,
    [missing, a],
  );
  assert.equal(
    (await client.query('SELECT status FROM submissions WHERE id = $1', [missing])).rows[0].status,
    'pending',
  );
  assert.equal(
    (await client.query('SELECT count(*)::integer AS count FROM foods')).rows[0].count,
    2,
  );
  checks += 2;
  await reject('UPDATE submissions SET status = $1 WHERE id = $2', ['approved', missing], '23514');
  await client.query(
    `INSERT INTO goal_versions (id, account_id, effective_date, objective, specification_version, accepted_inputs, accepted_targets, accepted_at)
    VALUES ($1, $2, '2026-11-09', 'maintain', 'contract-verification-only', '{}', '{}', now())`,
    [missing, a],
  );
  await reject(
    `INSERT INTO goal_versions (id, account_id, effective_date, objective, specification_version, accepted_inputs, accepted_targets, accepted_at)
    VALUES ($1, $2, '2026-11-09', 'maintain', 'contract-verification-only', '{}', '{}', now())`,
    [connection, a],
    '23505',
  );
  const requestKey = '60000000-0000-4000-8000-000000000001';
  const digest = 'a'.repeat(64);
  const requestSql = `INSERT INTO write_requests (account_id, operation, request_key, request_digest, response_status, response_body)
    VALUES ($1, 'verification', $2, $3, 201, '{}')`;
  await client.query(requestSql, [a, requestKey, digest]);
  await client.query(requestSql, [b, requestKey, digest]);
  await reject(requestSql, [a, requestKey, digest], '23505');
  await client.query('ROLLBACK');
  assert.equal(
    (
      await client.query(
        "SELECT count(*)::integer AS count FROM information_schema.schemata WHERE schema_name = 'plan02_verification'",
      )
    ).rows[0].count,
    0,
  );
  checks += 1;
  console.info(
    `Local PostgreSQL verification passed: ${checks} checks. Verification schema and data rolled back.`,
  );
} catch (error) {
  console.error('Local PostgreSQL verification failed. No verification changes will be committed.');
  console.error(
    `Completed checks: ${checks}; category: ${/^[A-Z0-9]{5}$/.test(error.code ?? '') ? error.code : 'assertion-or-configuration'}.`,
  );
  process.exitCode = 1;
} finally {
  if (client) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
  await database?.end();
}
