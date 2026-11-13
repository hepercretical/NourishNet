import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/client.js';
import { requireLocalCatalogTarget } from '../src/db/localCatalog.js';

requireLocalCatalogTarget();
const database = createDatabase();
let cookie,
  checks = 0;
const artifact = new URL('../../private-artifacts/plan17-local-attempt.json', import.meta.url);
async function request(path, { body, method, status = 200, binary = false } = {}) {
  const response = await fetch(`http://127.0.0.1:5173/api${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
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
    data: binary
      ? Buffer.from(await response.arrayBuffer())
      : response.status === 204
        ? null
        : await response.json(),
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
  const front = await readFile(
    new URL('../../private-artifacts/package-photos/quaker-front.jpg', import.meta.url),
  );
  const label = await readFile(
    new URL('../../private-artifacts/package-photos/quaker-label.jpg', import.meta.url),
  );
  assert(
    front.length > 10000 && label.length > 10000,
    'Use actual package/label images, not image placeholders.',
  );
  const attempt = existsSync(artifact)
    ? JSON.parse(await readFile(artifact, 'utf8'))
    : { requestKey: randomUUID() };
  if (!existsSync(artifact)) await writeFile(artifact, JSON.stringify(attempt), { flag: 'wx' });
  const body = {
    barcode: '030000010402',
    productName: 'Quaker Old Fashioned Oats (42 oz canister)',
    servingBasis: '',
    nutrients: { calories: null, protein: null, fat: null, carbohydrates: null, sodium: null },
    front: { mime: 'image/jpeg', data: front.toString('base64') },
    label: { mime: 'image/jpeg', data: label.toString('base64') },
    requestKey: attempt.requestKey,
  };
  const counts = () =>
    database.query(
      'SELECT (SELECT count(*)::int FROM foods) AS foods,(SELECT count(*)::int FROM food_servings) AS servings,(SELECT count(*)::int FROM diary_entries) AS entries',
    );
  const before = await counts();
  await request('/submissions', { status: 401 });
  cookie = (await request('/auth/login', { body: accounts[0] })).cookie;
  const session = (await request('/auth/session')).data.account;
  const saved = (await request('/submissions', { body, status: 201 })).data.submission;
  assert.equal(saved.status, 'pending');
  assert.equal(saved.barcode, '00030000010402');
  assert.equal(saved.nutrients.calories, null);
  assert.deepEqual((await request('/submissions', { body, status: 201 })).data.submission, saved);
  await request('/submissions', { body: { ...body, requestKey: randomUUID() }, status: 409 });
  await request('/submissions', {
    body: { ...body, servingBasis: '1/2 cup dry (40 g)' },
    status: 409,
  });
  const detail = (await request(`/submissions/${saved.id}`)).data.submission;
  assert((await request('/submissions')).data.submissions.some((item) => item.id === saved.id));
  assert.deepEqual(
    (await request(detail.photos.front.replace('/api', ''), { binary: true })).data,
    front,
  );
  assert.deepEqual(
    (await request(detail.photos.label.replace('/api', ''), { binary: true })).data,
    label,
  );
  assert.equal((await request('/foods/barcode?code=030000010402')).data.status, 'unknown');
  await request('/submissions', {
    body: { ...body, front: { ...body.front, mime: 'image/png' }, requestKey: randomUUID() },
    status: 415,
  });
  await request('/auth/logout', { body: {}, status: 204 });
  cookie = null;
  cookie = (await request('/auth/login', { body: accounts[1] })).cookie;
  await request(`/submissions/${saved.id}`, { status: 404 });
  await request(`/submissions/${saved.id}/photos/front`, { status: 404, binary: true });
  assert(!(await request('/submissions')).data.submissions.some((item) => item.id === saved.id));
  await request('/auth/logout', { body: {}, status: 204 });
  cookie = null;
  cookie = (await request('/auth/login', { body: accounts[0] })).cookie;
  // This explicit test-only transition of its own record was included in human
  // approval. It does not create a reviewer role or expose a decision endpoint.
  await database.query(
    "UPDATE submissions SET status='needs-review' WHERE id=$1 AND account_id=$2 AND status='pending'",
    [saved.id, session.id],
  );
  const current = (await request(`/submissions/${saved.id}`)).data.submission;
  assert.equal(current.status, 'needs-review');
  const correction = {
    ...body,
    front: null,
    label: null,
    servingBasis: '1/2 cup dry (40 g)',
    revision: current.revision,
    requestKey: randomUUID(),
  };
  const corrected = (
    await request(`/submissions/${saved.id}`, { body: correction, method: 'PATCH' })
  ).data.submission;
  assert.equal(corrected.status, 'pending');
  assert.equal(corrected.revision, current.revision + 1);
  assert.deepEqual(
    (await request(`/submissions/${saved.id}`, { body: correction, method: 'PATCH' })).data
      .submission,
    corrected,
  );
  await request(`/submissions/${saved.id}`, {
    body: { ...correction, requestKey: randomUUID() },
    method: 'PATCH',
    status: 409,
  });
  assert.deepEqual((await counts()).rows, before.rows);
  await request('/auth/logout', { body: {}, status: 204 });
  cookie = null;
  await writeFile(
    new URL('../../private-artifacts/plan17-verification.json', import.meta.url),
    JSON.stringify(
      {
        scope: 'local-only actual manufacturer photo upload',
        checks,
        submissionId: saved.id,
        knownCatalogAndDiariesUnchanged: true,
        source: 'https://smartlabel.pepsico.info/030000010402-0008-en-US/index.html',
        hosted: 'not contacted',
      },
      null,
      2,
    ),
  );
  console.info(
    `Plan-17 local verification passed: ${checks} request/check groups, exact photo bytes, duplicate/retry/correction and owner isolation. Catalog/diary unchanged.`,
  );
} catch {
  console.error(
    `Local submission verification stopped after ${checks} checks; no credentials or photo data printed.`,
  );
  process.exitCode = 1;
} finally {
  if (cookie) await request('/auth/logout', { body: {}, status: 204 }).catch(() => {});
  await database.end();
}
