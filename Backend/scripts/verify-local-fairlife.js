import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import { requireLocalCatalogTarget } from '../src/db/localCatalog.js';
import { localToday } from '../../shared/personal.js';

// Explicit local-only actual-product verification; no startup/build/test imports.
requireLocalCatalogTarget();
const db = createDatabase();
let checks = 0,
  cookie,
  otherCookie,
  entry,
  date;
const catalog = JSON.parse(
  await readFile(
    new URL('../catalog/fairlife-nutrition-plan-chocolate.json', import.meta.url),
    'utf8',
  ),
);
const food = catalog.foods[0];
async function request(path, { body, method, status = 200, actor = cookie } = {}) {
  const r = await fetch(`http://127.0.0.1:5173/api${path}`, {
    method: method ?? (body ? 'POST' : 'GET'),
    redirect: 'error',
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Content-Type': 'application/json',
      ...(actor ? { Cookie: actor } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(r.status, status);
  checks++;
  return {
    data: r.status === 204 ? null : await r.json(),
    cookie: r.headers.get('set-cookie')?.split(';')[0],
  };
}
async function remove() {
  if (entry) {
    await request(`/diary/entries/${entry.id}`, {
      method: 'DELETE',
      body: { date, revision: entry.revision, requestKey: randomUUID() },
    });
    entry = null;
  }
}
try {
  const baseline = JSON.parse(
    await readFile(
      new URL('../../private-artifacts/fairlife-before-import.json', import.meta.url),
      'utf8',
    ),
  );
  const drafts = JSON.parse(
    await readFile(
      new URL('../../private-artifacts/plan14a-test-accounts.json', import.meta.url),
      'utf8',
    ),
  );
  const login = await request('/auth/login', {
    body: { email: drafts[0].email, password: drafts[0].password },
  });
  cookie = login.cookie;
  otherCookie = (
    await request('/auth/login', { body: { email: drafts[1].email, password: drafts[1].password } })
  ).cookie;
  date = localToday(login.data.account.timeZone);
  for (const code of ['811620022118', '0811620022118', '00811620022118']) {
    const result = (await request('/foods/barcode?' + new URLSearchParams({ code }))).data;
    assert.equal(result.status, 'found');
    assert.equal(result.foods.length, 1);
    assert.equal(result.foods[0].id, food.id);
    assert.equal(result.foods[0].servingId, food.servingId);
    assert.deepEqual(result.foods[0].nutrients, food.nutrients);
    assert.equal(result.foods[0].grams, null);
  }
  await request('/foods/barcode?code=1162002211', { status: 400 });
  const search = (await request('/foods?q=fairlife')).data.foods;
  assert.equal(search.filter((f) => f.id === food.id).length, 1);
  checks++;
  const before = (await request(`/diary?date=${date}`)).data;
  const draft = {
    date,
    servingId: food.servingId,
    quantity: 1,
    meal: 'snack',
    requestKey: randomUUID(),
  };
  const saved = await request('/diary', { body: draft, status: 201 });
  entry = saved.data.entry;
  assert.deepEqual((await request('/diary', { body: draft, status: 201 })).data, saved.data);
  checks++;
  const after = (await request(`/diary?date=${date}`)).data;
  const savedEntries = after.meals.flatMap((m) => m.entries).filter((e) => e.id === entry.id);
  assert.equal(savedEntries.length, 1);
  assert.deepEqual(savedEntries[0].contribution, food.nutrients);
  for (const [name, value] of Object.entries(food.nutrients))
    assert.equal(
      after.totals[name],
      before.totals[name] === null ? null : before.totals[name] + value,
    );
  assert.equal(
    (await request(`/diary?date=${date}`, { actor: otherCookie })).data.meals
      .flatMap((m) => m.entries)
      .some((e) => e.id === entry.id),
    false,
  );
  checks++;
  await remove();
  assert.deepEqual((await request(`/diary?date=${date}`)).data.totals, before.totals);
  checks++;
  for (const table of ['foods', 'food_servings', 'food_barcodes', 'diary_entries']) {
    const clause =
      table === 'foods'
        ? 'WHERE t.id <> $1'
        : table === 'food_servings'
          ? 'WHERE t.food_id <> $1'
          : table === 'food_barcodes'
            ? 'WHERE t.food_id <> $1'
            : '';
    const r = (
      await db.query(
        `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS data,count(*)::int AS count FROM ${table} t ${clause}`,
        clause ? [food.id] : [],
      )
    ).rows[0];
    assert.equal(r.count, baseline[table].count);
    assert.equal(createHash('sha256').update(r.data).digest('hex'), baseline[table].hash);
    checks++;
  }
  await writeFile(
    new URL('../../private-artifacts/fairlife-verification.json', import.meta.url),
    JSON.stringify(
      {
        date: '2026-11-13',
        checks,
        upc: '811620022118',
        gtin14: food.gtin14,
        nutrients: food.nutrients,
        servingBasis: food.servingBasis,
        lookup: '12/13/14 digits resolve one active record',
        diary: 'confirmed save/retry/persistence/totals/ownership pass; test entry removed',
        priorCatalogAndDiaries: 'unchanged',
        physicalCamera: 'pending human testing',
        providers: 'not contacted',
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${checks} local Fairlife checks. Barcode resolves; one confirmed save and retry preserve totals and ownership. Existing catalog/diary snapshots unchanged.`,
  );
} catch {
  console.error(
    `Local Fairlife verification stopped after ${checks} checks. No private diagnostics printed.`,
  );
  process.exitCode = 1;
} finally {
  await remove().catch(() => {});
  if (cookie) await request('/auth/logout', { body: {}, status: 204 }).catch(() => {});
  if (otherCookie)
    await request('/auth/logout', { actor: otherCookie, body: {}, status: 204 }).catch(() => {});
  await db.end();
}
