import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db/client.js';
import { requireLocalCatalogTarget } from '../src/db/localCatalog.js';
import { accountRepository } from '../src/db/accounts.js';
import { createAuthService } from '../src/auth/service.js';
import { foodRepository } from '../src/db/foods.js';
import { diaryRepository } from '../src/db/diary.js';

// Explicit human-approved local integration command, never imported by npm test.
// Uses actual catalog foods and two isolated test accounts. Credentials remain
// in ignored private-artifacts; no third-party identity/email service is used.
requireLocalCatalogTarget();
const database = createDatabase();
const messages = [];
const auth = createAuthService({
  repository: accountRepository(database),
  deliver: async (message) => messages.push(message),
});
const server = createApp({
  services: { auth, foods: foodRepository(database), diary: diaryRepository(database) },
});
const accountFile = new URL('../../private-artifacts/plan14a-test-accounts.json', import.meta.url);
const reportFile = new URL('../../private-artifacts/plan14a-verification.json', import.meta.url);
let checks = 0;
let correction;
const results = [];
async function request(path, { cookie, body, method, status = 200 } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: 'error',
  });
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  checks += 1;
  return {
    body: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
try {
  const baselineRows = await database.query(
    'SELECT id, to_jsonb(e)::text AS snapshot FROM diary_entries e ORDER BY id',
  );
  const baseline = JSON.parse(
    await readFile(
      new URL('../../private-artifacts/plan14a-baseline.json', import.meta.url),
      'utf8',
    ),
  );
  const before = await database.query(
    "SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.id),'[]'::jsonb)::text AS snapshot, count(*)::int AS count FROM diary_entries e",
  );
  if (!existsSync(accountFile)) {
    assert.equal(before.rows[0].count, baseline.count);
    assert.equal(
      createHash('sha256').update(before.rows[0].snapshot).digest('hex'),
      baseline.sha256,
    );
  }
  const runDate = '2026-11-12';
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let drafts;
  if (existsSync(accountFile)) drafts = JSON.parse(await readFile(accountFile, 'utf8'));
  else {
    const suffix = randomBytes(6).toString('hex');
    drafts = ['America/Denver', 'Pacific/Kiritimati'].map((timeZone, index) => ({
      email: `catalog-${index}-${suffix}@example.test`,
      password: randomBytes(24).toString('base64url'),
      displayName: `Local catalog tester ${index + 1}`,
      adult: true,
      timeZone,
    }));
    await mkdir(new URL('../../private-artifacts/', import.meta.url), { recursive: true });
    await writeFile(accountFile, JSON.stringify(drafts), { flag: 'wx', mode: 0o600 });
    for (const draft of drafts) {
      await request('/auth/signup', { body: draft, status: 202 });
      await request('/auth/verify', { body: { email: draft.email, code: messages.at(-1).code } });
    }
  }
  const users = [];
  for (const draft of drafts) {
    const login = await request('/auth/login', { body: draft });
    users.push({ cookie: login.cookie, account: login.body.account });
    assert.equal(
      (await request('/auth/session', { cookie: login.cookie })).body.account.id,
      login.body.account.id,
    );
  }
  const owner = users[0];
  const oats = (await request('/foods?q=QUAKER', owner)).body.foods[0];
  assert.equal(oats.nutrients.calories, 150);
  assert.equal(oats.nutrients.sodium, 0);
  assert.equal((await request('/foods?q=sample', owner)).body.foods.length, 0);
  assert.equal((await request('/foods?q=no-match-for-this-food', owner)).body.foods.length, 0);
  await request('/foods?q=oats', { status: 401 });
  results.push('Actual-food search; fictional/no-result search empty; authentication required');
  const date = runDate;
  const dayBefore = (await request(`/diary?date=${date}`, owner)).body;
  const newEntries = [];
  for (const [index, meal] of ['breakfast', 'lunch', 'dinner', 'snack'].entries()) {
    const draft = {
      date,
      meal,
      quantity: [1.5, 0.25, 1, 0.125][index],
      servingId: oats.servingId,
      requestKey: randomUUID(),
    };
    const saved = await request('/diary', { ...owner, body: draft, status: 201 });
    const retry = await request('/diary', { ...owner, body: draft, status: 201 });
    assert.deepEqual(saved.body, retry.body);
    newEntries.push(saved.body.entry);
    await request('/diary', { ...owner, body: { ...draft, quantity: 0 }, status: 400 });
    await request('/diary', { ...owner, body: { ...draft, quantity: 2 }, status: 409 });
  }
  const day = (await request(`/diary?date=${date}`, owner)).body;
  const quantity = 2.875;
  for (const name of ['calories', 'protein', 'fat', 'carbohydrates', 'sodium'])
    assert.equal(day.totals[name], dayBefore.totals[name] + oats.nutrients[name] * quantity);
  assert.deepEqual((await request(`/diary?date=${date}`, owner)).body, day);
  assert(
    (await request(`/diary?date=${date}`, users[1])).body.meals.every(
      (m) => m.entries.length === 0,
    ),
  );
  results.push(
    'Four meals, decimal scaled totals, persistence/read retry, duplicate-save replay, invalid quantity and account separation',
  );
  const first = newEntries[0];
  await request(`/diary/entries/${first.id}`, {
    ...users[1],
    method: 'PATCH',
    body: { date, revision: first.revision, quantity: 2, meal: 'snack', requestKey: randomUUID() },
    status: 404,
  });
  const editBody = {
    date,
    revision: first.revision,
    quantity: 0.5,
    meal: 'snack',
    requestKey: randomUUID(),
  };
  const edited = await request(`/diary/entries/${first.id}`, {
    ...owner,
    method: 'PATCH',
    body: editBody,
  });
  assert.equal(edited.body.entry.quantity, 0.5);
  assert.deepEqual(
    (await request(`/diary/entries/${first.id}`, { ...owner, method: 'PATCH', body: editBody }))
      .body,
    edited.body,
  );
  newEntries[0] = edited.body.entry;
  const savedDay = (await request(`/diary?date=${date}`, owner)).body;
  correction = await database.connect();
  await correction.query('BEGIN');
  await correction.query('UPDATE food_servings SET calories_kcal = calories_kcal + 1 WHERE id=$1', [
    oats.servingId,
  ]);
  assert.deepEqual(await diaryRepository(correction).get(owner.account, date), savedDay);
  await correction.query('ROLLBACK');
  correction.release();
  correction = null;
  results.push(
    'Actual-food diary retains saved nutrition while a catalog correction is rolled back',
  );
  for (const entry of newEntries) {
    const body = { date, revision: entry.revision, requestKey: randomUUID() };
    const path = `/diary/entries/${entry.id}`;
    const removed = await request(path, { ...owner, method: 'DELETE', body });
    assert.deepEqual(
      (await request(path, { ...owner, method: 'DELETE', body })).body,
      removed.body,
    );
  }
  assert.deepEqual((await request(`/diary?date=${date}`, owner)).body.totals, dayBefore.totals);
  results.push('Owner-only edit/remove, mutation retries and correct restored totals');
  for (const localDate of ['2024-02-29', '2026-03-08', '2026-11-01', '2026-12-31', '2027-01-01']) {
    const result = (await request(`/diary?date=${localDate}`, users[1])).body;
    assert.equal(result.date, localDate);
    assert.equal(result.timeZone, 'Pacific/Kiritimati');
  }
  await request('/diary?date=2026-02-30', { ...owner, status: 400 });
  await request('/diary', {
    ...owner,
    body: {
      date,
      servingId: '20000000-0000-4000-8000-000000000001',
      quantity: 1,
      meal: 'breakfast',
      requestKey: randomUUID(),
    },
    status: 404,
  });
  // A catalog correction is simulated in a rolled-back transaction, never
  // committed or observed through the application catalog.
  correction = await database.connect();
  await correction.query('BEGIN');
  await correction.query('UPDATE food_servings SET calories_kcal = calories_kcal + 1 WHERE id=$1', [
    oats.servingId,
  ]);
  const after = await correction.query(
    'SELECT id, to_jsonb(e)::text AS snapshot FROM diary_entries e WHERE id = ANY($1::uuid[]) ORDER BY id',
    [baselineRows.rows.map((r) => r.id)],
  );
  assert.deepEqual(after.rows, baselineRows.rows);
  await correction.query('ROLLBACK');
  correction.release();
  correction = null;
  results.push(
    'Local leap/DST/year dates, invalid date, retired-food save rejected and original diary snapshots unchanged',
  );
  for (const [index, user] of users.entries()) {
    await request('/auth/logout', { ...user, body: {}, status: 204 });
    await request('/auth/session', { ...user, status: 401 });
    const again = await request('/auth/login', { body: drafts[index] });
    assert.equal(again.body.account.id, user.account.id);
    await request('/auth/logout', { cookie: again.cookie, body: {}, status: 204 });
  }
  await writeFile(
    reportFile,
    JSON.stringify(
      {
        scope: 'local only',
        checks,
        results,
        browserReview: 'pending; no CUA browser/native surface available',
        hosted: 'not contacted',
      },
      null,
      2,
    ),
  );
  console.info(
    `Plan-14A local verification passed: ${checks} request/check groups. Existing diary snapshots preserved; no hosted service contacted.`,
  );
} catch {
  console.error(
    `Plan-14A local verification stopped after ${checks} checks; inspect the local test setup without printing credentials.`,
  );
  process.exitCode = 1;
} finally {
  if (correction) {
    await correction.query('ROLLBACK');
    correction.release();
  }
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await database.end();
}
