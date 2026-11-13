import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db/client.js';
import { requireLocalCatalogTarget } from '../src/db/localCatalog.js';
import { localServices } from '../src/services/local.js';
import { personalRepository } from '../src/db/personal.js';
import { localToday, shiftDay } from '../../shared/personal.js';

// Explicit human-approved local integration; never called from startup/build/tests.
requireLocalCatalogTarget();
const db = createDatabase(),
  services = localServices(),
  server = createApp({ services });
let checks = 0;
const key = () => randomUUID();
async function request(path, { cookie, body, method, status = 200 } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method: method ?? (body ? 'POST' : 'GET'),
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'error',
  });
  assert.equal(response.status, status);
  checks++;
  return {
    data: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
const hash = async () =>
  createHash('sha256')
    .update(
      (
        await db.query(
          "SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.id),'[]'::jsonb)::text AS data FROM diary_entries e",
        )
      ).rows[0].data,
    )
    .digest('hex');
try {
  const before = await hash();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const drafts = JSON.parse(
    await readFile(
      new URL('../../private-artifacts/plan14a-test-accounts.json', import.meta.url),
      'utf8',
    ),
  );
  const users = [];
  for (const draft of drafts) {
    const login = await request('/auth/login', {
      body: { email: draft.email, password: draft.password },
    });
    users.push({ cookie: login.cookie, account: login.data.account });
  }
  const owner = users[0],
    other = users[1],
    today = localToday(owner.account.timeZone),
    future = shiftDay(today, 365);
  await request(`/personal/goals?date=${today}`, { status: 401 });
  const prior = (await request(`/personal/goals?date=${future}`, owner)).data.goal;
  const otherPrior = (await request(`/personal/goals?date=${future}`, other)).data;
  const goal = {
    effectiveDate: future,
    calories: 2000,
    mode: 'maintain',
    macroMode: 'percent',
    macros: { protein: 30, carbohydrates: 50, fat: 20 },
    provenance: { kind: 'manual' },
    currentVersion: prior?.effectiveDate === future ? prior.id : null,
    requestKey: key(),
  };
  const created = (await request('/personal/goals', { ...owner, body: goal })).data;
  assert.deepEqual((await request('/personal/goals', { ...owner, body: goal })).data, created);
  checks++;
  await request('/personal/goals', { ...owner, body: { ...goal, calories: 2100 }, status: 409 });
  const manualDate = shiftDay(future, 1);
  const manualPrior = (await request(`/personal/goals?date=${manualDate}`, owner)).data.goal;
  const manual = {
    ...goal,
    effectiveDate: manualDate,
    macros: null,
    currentVersion: manualPrior?.effectiveDate === manualDate ? manualPrior.id : null,
    requestKey: key(),
  };
  const optional = await request('/personal/goals', { ...owner, body: manual });
  assert.equal(optional.data.goal.macros, null);
  checks++;
  const independentlyRead = await personalRepository(db).getGoal(owner.account, future);
  assert.equal(independentlyRead.goal.id, created.goal.id);
  checks++;
  assert.deepEqual((await request(`/personal/goals?date=${future}`, other)).data, otherPrior);
  checks++;
  await request('/personal/goals', {
    ...owner,
    body: { ...goal, effectiveDate: shiftDay(today, -1), requestKey: key() },
    status: 400,
  });
  await request(`/personal/goals?date=${future}&accountId=other`, { ...owner, status: 400 });
  const appearance = (await request('/personal/appearance', owner)).data;
  const changed = (
    await request('/personal/appearance', {
      ...owner,
      method: 'PUT',
      body: { mode: 'dark', accent: 'purple', revision: appearance.revision, requestKey: key() },
    })
  ).data;
  assert.equal((await request('/personal/appearance', owner)).data.accent, 'purple');
  checks++;
  await request('/personal/appearance', {
    ...owner,
    method: 'PUT',
    body: { mode: 'dark', accent: 'red', revision: appearance.revision, requestKey: key() },
    status: 409,
  });
  await request('/personal/appearance', {
    ...owner,
    method: 'PUT',
    body: {
      mode: appearance.mode,
      accent: appearance.accent,
      revision: changed.revision,
      requestKey: key(),
    },
  });
  const weightDate = shiftDay(today, -1);
  const weights = (await request(`/personal/weights?from=${weightDate}&to=${today}`, owner)).data
    .weights;
  const previous = weights.find((w) => w.date === weightDate);
  const weightDraft = {
    date: weightDate,
    weight: 72.5,
    unit: 'kg',
    removed: false,
    currentVersion: previous?.id ?? null,
    requestKey: key(),
  };
  const savedWeight = (await request('/personal/weights', { ...owner, body: weightDraft })).data
    .weight;
  assert.equal(
    (await request(`/personal/weights?from=${weightDate}&to=${today}`, owner)).data.weights.find(
      (w) => w.id === savedWeight.id,
    ).kg,
    72.5,
  );
  checks++;
  assert.equal(
    (await request(`/personal/weights?from=${weightDate}&to=${today}`, other)).data.weights.some(
      (w) => w.id === savedWeight.id,
    ),
    false,
  );
  checks++;
  await request('/personal/weights', {
    ...owner,
    body: { ...weightDraft, requestKey: key() },
    status: 409,
  });
  await request('/personal/weights', {
    ...owner,
    body: {
      ...weightDraft,
      currentVersion: savedWeight.id,
      removed: !previous,
      weight: previous?.kg ?? 72.5,
      requestKey: key(),
    },
  });
  const stats = (await request(`/personal/stats?from=${today.slice(0, 7)}-01&to=${today}`, owner))
    .data;
  assert.ok(Number.isInteger(stats.streaks.current));
  assert.ok(Array.isArray(stats.goals));
  checks++;
  const diaryBefore = (await request(`/diary?date=${today}`, owner)).data;
  const countBefore = diaryBefore.meals.reduce((n, m) => n + m.entries.length, 0);
  const food = (await request('/foods?q=Quaker', owner)).data.foods[0];
  const createdEntry = (
    await request('/diary', {
      ...owner,
      status: 201,
      body: {
        date: today,
        meal: 'snack',
        quantity: 1,
        servingId: food.servingId,
        requestKey: key(),
      },
    })
  ).data.entry;
  let revision = createdEntry.revision;
  try {
    const afterAdd = (await request(`/personal/stats?from=${today}&to=${today}`, owner)).data
      .days[0];
    assert.equal(afterAdd.count, countBefore + 1);
    assert.equal(afterAdd.calories, diaryBefore.totals.calories + food.nutrients.calories);
    checks++;
    const edited = (
      await request(`/diary/entries/${createdEntry.id}`, {
        ...owner,
        method: 'PATCH',
        body: { date: today, quantity: 2, meal: 'snack', revision, requestKey: key() },
      })
    ).data.entry;
    revision = edited.revision;
    const afterEdit = (await request(`/personal/stats?from=${today}&to=${today}`, owner)).data
      .days[0];
    assert.equal(afterEdit.calories, diaryBefore.totals.calories + 2 * food.nutrients.calories);
    checks++;
  } finally {
    await request(`/diary/entries/${createdEntry.id}`, {
      ...owner,
      method: 'DELETE',
      body: { date: today, revision, requestKey: key() },
    });
  }
  const afterRemove = (await request(`/personal/stats?from=${today}&to=${today}`, owner)).data
    .days[0];
  assert.equal(afterRemove?.count ?? 0, countBefore);
  checks++;
  const notices = (await request('/personal/notifications', owner)).data.submissions;
  assert.ok(notices.every((n) => !Object.hasOwn(n, 'accountId')));
  checks++;
  // Profile/password verification uses the real SQL in savepoints then rolls back,
  // preserving both accounts' credentials, sessions, names and time zones.
  const c = await db.connect();
  await c.query('BEGIN');
  let n = 0,
    active;
  const isolated = {
    query: (...args) => c.query(...args),
    connect: async () => ({
      release() {},
      async query(sql, args) {
        if (sql === 'BEGIN') {
          active = `personal_verify_${++n}`;
          return c.query(`SAVEPOINT ${active}`);
        }
        if (sql === 'COMMIT') return c.query(`RELEASE SAVEPOINT ${active}`);
        if (sql === 'ROLLBACK') {
          await c.query(`ROLLBACK TO SAVEPOINT ${active}`);
          return c.query(`RELEASE SAVEPOINT ${active}`);
        }
        return c.query(sql, args);
      },
    }),
  };
  try {
    const repo = personalRepository(isolated);
    await repo.profile(owner.account, {
      displayName: 'Isolated local profile check',
      timeZone: 'UTC',
      previousName: owner.account.displayName,
      previousTimeZone: owner.account.timeZone,
      requestKey: key(),
    });
    checks++;
    await assert.rejects(
      repo.password(owner.account, {
        currentPassword: 'incorrect-test-password',
        newPassword: 'replacement-private-test-password',
      }),
    );
    checks++;
    await repo.password(owner.account, {
      currentPassword: drafts[0].password,
      newPassword: 'replacement-private-test-password',
    });
    checks++;
    assert.equal(
      (
        await c.query(
          'SELECT count(*)::int AS count FROM account_sessions WHERE account_id=$1 AND revoked_at IS NULL',
          [owner.account.id],
        )
      ).rows[0].count,
      0,
    );
    checks++;
  } finally {
    await c.query('ROLLBACK');
    c.release();
  }
  assert.equal(await hash(), before);
  checks++;
  for (const user of users) await request('/auth/logout', { ...user, body: {}, status: 204 });
  await writeFile(
    new URL('../../private-artifacts/design-local-verification.json', import.meta.url),
    JSON.stringify(
      {
        checks,
        target: 'loopback only',
        diarySnapshots: 'unchanged',
        goal: 'test account future version retained',
        appearance: 'restored',
        weight: 'restored or tombstoned',
        profilePassword: 'rolled back',
        providers: 'not contacted',
      },
      null,
      2,
    ),
  );
  console.info(`PASS: ${checks} local personal-tracking check groups; diary snapshots unchanged.`);
} catch {
  console.error(
    `Local personal verification stopped after ${checks} check groups; no private diagnostics printed.`,
  );
  process.exitCode = 1;
} finally {
  if (server.listening) await new Promise((r) => server.close(r));
  else services.close();
  await db.end();
}
