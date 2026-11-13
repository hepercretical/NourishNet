import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import { requireLocalCatalogTarget } from '../src/db/localCatalog.js';

requireLocalCatalogTarget();
const database = createDatabase();
let cookie;
let checks = 0;
async function request(path, { body, status = 200 } = {}) {
  const response = await fetch(`http://127.0.0.1:5173/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    redirect: 'error',
    headers: {
      Origin: 'http://127.0.0.1:5173',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  checks++;
  return {
    data: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
try {
  const accounts = JSON.parse(
    await readFile(
      new URL('../../private-artifacts/plan14a-test-accounts.json', import.meta.url),
      'utf8',
    ),
  );
  const catalog = JSON.parse(
    await readFile(new URL('../catalog/manufacturer-foods.json', import.meta.url), 'utf8'),
  );
  const counts = () =>
    database.query(
      'SELECT (SELECT count(*)::int FROM foods) AS foods, (SELECT count(*)::int FROM food_servings) AS servings, (SELECT count(*)::int FROM diary_entries) AS entries',
    );
  const before = await counts();
  await request('/foods/barcode?code=030000010204', { status: 401 });
  cookie = (await request('/auth/login', { body: accounts[0] })).cookie;
  for (const food of catalog.foods) {
    for (const code of [food.gtin14.slice(2), food.gtin14.slice(1), food.gtin14]) {
      const { data } = await request('/foods/barcode?' + new URLSearchParams({ code }));
      assert.equal(data.status, 'found');
      assert.equal(data.barcode.input, code);
      assert.equal(data.barcode.gtin14, food.gtin14);
      assert.equal(data.foods[0].id, food.id);
      assert.equal(data.foods[0].servingId, food.servingId);
      assert.deepEqual(data.foods[0].nutrients, food.nutrients);
    }
  }
  const unknown = (await request('/foods/barcode?code=6291041500213')).data;
  assert.equal(unknown.status, 'unknown');
  assert.deepEqual(unknown.foods, []);
  for (const path of [
    '/foods/barcode?code=030000010205',
    '/foods/barcode?code=1&code=2',
    '/foods/barcode?code=030000010204&accountId=other',
    '/foods/barcode',
  ])
    await request(path, { status: 400 });
  assert.deepEqual((await counts()).rows, before.rows);
  await request('/auth/logout', { body: {}, status: 204 });
  cookie = null;
  await writeFile(
    new URL('../../private-artifacts/plan14-verification.json', import.meta.url),
    JSON.stringify(
      {
        scope: 'loopback API through local Vite proxy only',
        checks,
        knownProducts: catalog.foods.length,
        foodServingAndDiaryCountsUnchanged: true,
        hosted: 'not contacted',
      },
      null,
      2,
    ),
  );
  console.info(
    `Plan-14 local barcode verification passed: ${checks} request groups; catalog and diary counts unchanged.`,
  );
} catch {
  console.error(
    `Local barcode verification stopped after ${checks} checks. No private diagnostics printed.`,
  );
  process.exitCode = 1;
} finally {
  if (cookie) await request('/auth/logout', { body: {}, status: 204 }).catch(() => {});
  await database.end();
}
