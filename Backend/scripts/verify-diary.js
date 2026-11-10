import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db/client.js';
import { requireSyntheticDevelopment } from '../src/db/config.js';
import { createAuthService } from '../src/auth/service.js';
import { accountRepository } from '../src/db/accounts.js';
import { diaryRepository } from '../src/db/diary.js';
import { foodRepository } from '../src/db/foods.js';

// Explicit integration command, separate from mocked npm test. Retains only
// uniquely named synthetic accounts/diaries; catalog corrections roll back.
requireSyntheticDevelopment();
assert.equal(process.env.DATABASE_EXPECTED_HOST, '127.0.0.1');
assert.equal(process.env.DATABASE_EXPECTED_NAME, 'nourishnet_plan02_dev');
const database = createDatabase();
const messages = [];
const auth = createAuthService({
  repository: accountRepository(database),
  deliver: async (message) => messages.push(message),
});
const diary = diaryRepository(database);
const server = createApp({ services: { auth, diary, foods: foodRepository(database) } });
const suffix = randomBytes(6).toString('hex');
let checks = 0;
let client;
async function request(path, { body, cookie, status = 200, method } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method: method ?? (body ? 'POST' : 'GET'),
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  checks += 1;
  return { body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const users = [];
  for (const timeZone of ['America/Denver', 'Pacific/Kiritimati']) {
    const draft = {
      email: `diary-${users.length}-${suffix}@example.test`,
      displayName: 'Synthetic Diary Fixture',
      password: randomBytes(24).toString('base64url'),
      adult: true,
      timeZone,
    };
    await request('/auth/signup', { body: draft, status: 202 });
    await request('/auth/verify', { body: { email: draft.email, code: messages.at(-1).code } });
    const login = await request('/auth/login', { body: draft });
    users.push({ account: login.body.account, cookie: login.cookie });
  }
  await request('/diary?date=2026-11-01', { status: 401 });
  const foods = (await request('/foods?q=SAMPLE', users[0])).body.foods;
  const unknown = foods.find((food) => food.nutrients.sodium === null);
  const zero = foods.find((food) => food.nutrients.sodium === 0);
  assert(unknown && zero);
  const draft = {
    date: '2026-11-01',
    servingId: unknown.servingId,
    quantity: 1.5,
    meal: 'breakfast',
    requestKey: randomUUID(),
  };
  const saved = await Promise.all(
    [1, 2].map(() =>
      request('/diary', {
        ...users[0],
        body: draft,
        status: 201,
      }),
    ),
  );
  assert.deepEqual(saved[0].body, saved[1].body);
  await request('/diary', { ...users[0], body: { ...draft, quantity: 2 }, status: 409 });
  await request('/diary', {
    ...users[0],
    body: { ...draft, accountId: users[1].account.id },
    status: 400,
  });
  const second = {
    ...draft,
    servingId: zero.servingId,
    quantity: 0.25,
    meal: 'lunch',
    requestKey: randomUUID(),
  };
  await request('/diary', { ...users[0], body: second, status: 201 });
  const recorded = (await request(`/diary?date=${draft.date}`, users[0])).body;
  assert.equal(recorded.meals[0].entries.length, 1);
  assert.equal(recorded.meals[1].entries.length, 1);
  for (const name of ['calories', 'protein', 'fat', 'carbohydrates']) {
    assert.equal(
      recorded.totals[name],
      unknown.nutrients[name] * 1.5 + zero.nutrients[name] * 0.25,
    );
  }
  assert.equal(recorded.totals.sodium, null);
  assert.equal(recorded.meals[1].totals.sodium, 0);
  assert.deepEqual(await diaryRepository(database).get(users[0].account, draft.date), recorded);
  checks += 1;
  const other = (await request(`/diary?date=${draft.date}`, users[1])).body;
  assert(other.meals.every((meal) => meal.entries.length === 0));
  assert.equal(other.timeZone, 'Pacific/Kiritimati');
  for (const date of [
    '2026-10-31',
    '2026-11-02',
    '2026-03-08',
    '2024-02-29',
    '2026-12-31',
    '2027-01-01',
  ]) {
    const empty = (await request(`/diary?date=${date}`, users[0])).body;
    assert.equal(empty.date, date);
    assert.equal(empty.totals.calories, 0);
  }
  // Each selected local day is stored literally across DST/year/leap boundaries.
  for (const date of ['2026-03-08', '2024-02-29', '2026-12-31', '2027-01-01']) {
    await request('/diary', {
      ...users[1],
      body: { ...second, date, requestKey: randomUUID() },
      status: 201,
    });
    const day = (await request(`/diary?date=${date}`, users[1])).body;
    assert.equal(day.date, date);
    assert.equal(day.meals[1].entries.length, 1);
    assert.equal(day.timeZone, 'Pacific/Kiritimati');
  }
  client = await database.connect();
  await client.query('BEGIN');
  await client.query('UPDATE foods SET name = $1, version = version + 1 WHERE id = $2', [
    'Corrected synthetic fixture',
    unknown.id,
  ]);
  await client.query(
    'UPDATE food_servings SET label = $1, calories_kcal = 999, sodium_mg = 999 WHERE id = $2',
    ['Changed basis', unknown.servingId],
  );
  assert.deepEqual(await diaryRepository(client).get(users[0].account, draft.date), recorded);
  await client.query('ROLLBACK');
  client.release();
  client = null;
  checks += 1;
  // Plan-12: all mutations target only the synthetic fixtures created above.
  const original = saved[0].body.entry;
  const path = `/diary/entries/${original.id}`;
  const edit = {
    date: draft.date,
    revision: original.revision,
    quantity: 0.125,
    meal: 'dinner',
    requestKey: randomUUID(),
  };
  await request(path, { body: edit, method: 'PATCH', status: 401 });
  await request(path, { ...users[1], body: edit, method: 'PATCH', status: 404 });
  await request(path, {
    ...users[0],
    body: { ...edit, date: '2026-11-02' },
    method: 'PATCH',
    status: 404,
  });
  await request(path, {
    ...users[0],
    body: { ...edit, quantity: 0 },
    method: 'PATCH',
    status: 400,
  });
  await request(path, {
    ...users[0],
    body: { ...edit, accountId: users[1].account.id },
    method: 'PATCH',
    status: 400,
  });
  const updates = await Promise.all(
    [1, 2].map(() => request(path, { ...users[0], body: edit, method: 'PATCH' })),
  );
  assert.deepEqual(updates[0].body, updates[1].body);
  const updated = updates[0].body.entry;
  assert.equal(updated.revision, original.revision + 1);
  for (const field of [
    'foodName',
    'servingBasis',
    'servingId',
    'catalogVersion',
    'grams',
    'nutrients',
  ])
    assert.deepEqual(updated[field], original[field]);
  await request(path, {
    ...users[0],
    body: { ...edit, quantity: 2 },
    method: 'PATCH',
    status: 409,
  });
  await request(path, {
    ...users[0],
    body: { ...edit, requestKey: randomUUID() },
    method: 'PATCH',
    status: 409,
  });
  const edited = (await request(`/diary?date=${draft.date}`, users[0])).body;
  assert.equal(edited.meals[0].entries.length, 0);
  assert.equal(edited.meals[2].entries[0].quantity, 0.125);
  assert.equal(
    edited.totals.calories,
    unknown.nutrients.calories * 0.125 + zero.nutrients.calories * 0.25,
  );
  assert.equal(edited.totals.sodium, null);
  const removal = { date: draft.date, revision: updated.revision, requestKey: randomUUID() };
  await request(path, { ...users[1], body: removal, method: 'DELETE', status: 404 });
  await request(path, {
    ...users[0],
    body: { ...removal, revision: 1 },
    method: 'DELETE',
    status: 409,
  });
  const removed = await Promise.all(
    [1, 2].map(() => request(path, { ...users[0], body: removal, method: 'DELETE' })),
  );
  assert.deepEqual(removed[0].body, removed[1].body);
  await request(path, {
    ...users[0],
    body: { ...removal, requestKey: randomUUID() },
    method: 'DELETE',
    status: 404,
  });
  const remaining = (await request(`/diary?date=${draft.date}`, users[0])).body;
  assert.equal(remaining.meals[2].entries.length, 0);
  assert.equal(remaining.totals.sodium, 0);
  assert.equal(remaining.totals.calories, zero.nutrients.calories * 0.25);
  const last = remaining.meals[1].entries[0];
  await request(`/diary/entries/${last.id}`, {
    ...users[0],
    method: 'DELETE',
    body: {
      date: draft.date,
      revision: last.revision,
      requestKey: randomUUID(),
    },
  });
  const empty = (await request(`/diary?date=${draft.date}`, users[0])).body;
  assert(empty.meals.every((meal) => meal.entries.length === 0));
  assert.equal(empty.totals.calories, 0);
  assert.equal(empty.totals.sodium, 0);
  console.info(
    `Plan-10/12 local verification passed: ${checks} request/check groups. Synthetic diary mutations verified; catalog corrections rolled back. No credentials printed.`,
  );
} catch {
  console.error(
    `Plan-10/12 local verification failed after ${checks} checks. No private diagnostics printed.`,
  );
  process.exitCode = 1;
} finally {
  if (client) {
    await client.query('ROLLBACK');
    client.release();
  }
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await database.end();
}
