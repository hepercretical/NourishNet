import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import { requireSyntheticDevelopment } from '../src/db/config.js';
import { foodRepository } from '../src/db/foods.js';

// Explicit local integration check. Never run as part of mocked npm test.
requireSyntheticDevelopment();
assert.equal(process.env.DATABASE_EXPECTED_HOST, '127.0.0.1');
assert.equal(process.env.DATABASE_EXPECTED_NAME, 'nourishnet_plan02_dev');
const base = 'http://127.0.0.1:3001/api';
const origin = 'http://127.0.0.1:5173';
const database = createDatabase();
const suffix = randomBytes(6).toString('hex');
let checks = 0;
async function request(path, { body, cookie, status = 200 } = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Origin: origin,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.equal(response.status, status, `Unexpected HTTP status for ${path}`);
  checks += 1;
  return {
    data: status === 204 ? null : await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
async function codeFor(email, purpose) {
  const directory = new URL('../outbox/', import.meta.url);
  const files = (await readdir(directory))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reverse();
  for (const name of files) {
    const message = JSON.parse(await readFile(new URL(name, directory), 'utf8'));
    if (message.email === email && message.purpose === purpose) return message.code;
  }
  throw new Error('Expected local outbox message is missing.');
}
try {
  const users = [];
  for (const name of ['Avery', 'Morgan']) {
    const draft = {
      email: `${name.toLowerCase()}-${suffix}@example.test`,
      password: randomBytes(24).toString('base64url'),
      displayName: `${name} Integration Fixture`,
      timeZone: name === 'Avery' ? 'America/Denver' : 'Pacific/Auckland',
      adult: true,
    };
    await request('/auth/signup', { body: draft, status: 202 });
    await request('/auth/login', { body: draft, status: 403 });
    const code = await codeFor(draft.email, 'verify');
    await request('/auth/verify', { body: { email: draft.email, code } });
    await request('/auth/verify', { body: { email: draft.email, code }, status: 400 });
    const login = await request('/auth/login', { body: draft });
    assert(login.cookie);
    assert.equal(login.data.account.sharing, false);
    assert.equal(login.data.sessionToken, undefined);
    users.push({ draft, ...login });
  }
  for (const user of users) {
    const diary = await request('/dashboard', { cookie: user.cookie });
    assert.equal(diary.data.accountId, user.data.account.id);
    assert(diary.data.meals.every((meal) => meal.entries.length === 0));
    assert.equal(diary.data.timeZone, user.draft.timeZone);
    checks += 1;
  }
  assert.notEqual(users[0].data.account.id, users[1].data.account.id);
  const foods = await request('/foods?q=SAMPLE', { cookie: users[0].cookie });
  assert.equal(foods.data.foods.length, 2);
  assert(foods.data.foods.some((food) => food.nutrients.sodium === null));
  assert(foods.data.foods.some((food) => food.nutrients.sodium === 0));
  checks += 1;
  for (const query of ['', 'nonexistent-synthetic-food', "%' OR 1=1 --", '_']) {
    assert.deepEqual(
      (await request(`/foods?q=${encodeURIComponent(query)}`, { cookie: users[0].cookie })).data
        .foods,
      [],
    );
  }
  await request('/foods', { status: 401 });
  await request('/auth/logout', { body: {}, cookie: users[0].cookie, status: 204 });
  await request('/dashboard', { cookie: users[0].cookie, status: 401 });
  await request('/dashboard', { cookie: users[1].cookie });
  const active = await request('/auth/login', { body: users[0].draft });
  await request('/auth/recover', { body: { email: users[0].draft.email }, status: 202 });
  const resetCode = await codeFor(users[0].draft.email, 'recover');
  const replacement = randomBytes(24).toString('base64url');
  await request('/auth/reset', {
    body: { email: users[0].draft.email, code: resetCode, password: replacement },
  });
  await request('/auth/session', { cookie: active.cookie, status: 401 });
  await request('/auth/login', { body: users[0].draft, status: 401 });
  const resetLogin = await request('/auth/login', {
    body: { ...users[0].draft, password: replacement },
  });
  await database.query(
    "UPDATE account_sessions SET expires_at = now() - interval '1 second' WHERE account_id = $1",
    [users[0].data.account.id],
  );
  await request('/auth/session', { cookie: resetLogin.cookie, status: 401 });
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < 30; i += 1) {
      const food = randomUUID();
      await client.query("INSERT INTO foods (id, name, provenance) VALUES ($1, $2, 'synthetic')", [
        food,
        `Bound fixture ${suffix} ${i}`,
      ]);
      await client.query(
        'INSERT INTO food_servings (id, food_id, label, calories_kcal, protein_g, fat_g, carbohydrates_g) VALUES ($1, $2, $3, 1, 1, 1, 1)',
        [randomUUID(), food, '1 synthetic serving'],
      );
    }
    const query = `Bound fixture ${suffix}`;
    assert.equal((await foodRepository(client).search(query)).length, 25);
    checks += 1;
    await client.query('ROLLBACK');
    assert.equal((await foodRepository(client).search(query)).length, 0);
    checks += 1;
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
  console.info(
    `Local Plan-05/06 verification passed: ${checks} checks. Two fictional account fixtures retained; temporary catalog fixtures rolled back. No credentials or codes printed.`,
  );
} catch (error) {
  console.error(
    `Local Plan-05/06 verification failed after ${checks} checks. Category: ${error.code || 'assertion-or-http'}.`,
  );
  process.exitCode = 1;
} finally {
  await database.end();
}
