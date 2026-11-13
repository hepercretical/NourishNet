import { once } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { AccountError } from '../auth/service.js';
let server;
afterEach(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
});
async function setup({ denied = false } = {}) {
  const submission = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', status: 'pending' };
  const submissions = {
    list: vi.fn(async () => ({ submissions: [] })),
    get: vi.fn(async () => ({ submission })),
    create: vi.fn(async () => ({ submission })),
    correct: vi.fn(async () => ({ submission })),
    photo: vi.fn(async () => ({ bytes: Buffer.from([255, 216, 255]), mime: 'image/jpeg' })),
  };
  server = createApp({
    services: {
      auth: {
        session: vi.fn(async () => {
          if (denied) throw new AccountError('Sign in.', 401);
          return { id: 'owner' };
        }),
      },
      submissions,
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    submissions,
    base: `http://127.0.0.1:${server.address().port}/api/submissions`,
    submission,
  };
}
it('creates, lists and reads owned records with no-store and protected image content types', async () => {
  const { base, submissions, submission } = await setup();
  const response = await fetch(base, {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestKey: 'key' }),
  });
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ submission });
  expect(submissions.create).toHaveBeenCalledWith({ id: 'owner' }, { requestKey: 'key' });
  expect((await fetch(base)).headers.get('cache-control')).toBe('no-store');
  const photo = await fetch(base + '/' + submission.id + '/photos/front');
  expect(photo.headers.get('content-type')).toBe('image/jpeg');
  expect(photo.headers.get('x-content-type-options')).toBe('nosniff');
  expect(Buffer.from(await photo.arrayBuffer())).toEqual(Buffer.from([255, 216, 255]));
});
it('refuses unsigned requests, wrong origins, query parameters and methods before mutations', async () => {
  let state = await setup({ denied: true });
  expect((await fetch(state.base)).status).toBe(401);
  await new Promise((resolve) => server.close(resolve));
  state = await setup();
  expect(
    (await fetch(state.base, { method: 'POST', headers: { Origin: 'https://other.invalid' } }))
      .status,
  ).toBe(403);
  expect((await fetch(state.base + '?account=other')).status).toBe(400);
  const wrong = await fetch(state.base, { method: 'DELETE' });
  expect(wrong.status).toBe(405);
  expect(wrong.headers.get('allow')).toBe('GET, POST');
  expect(state.submissions.create).not.toHaveBeenCalled();
});
it('keeps JSON/storage failures recoverable without returning diagnostics and forwards correction revisions', async () => {
  const { base, submissions, submission } = await setup();
  const options = {
    method: 'PATCH',
    headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({ revision: 1 }),
  };
  expect((await fetch(base + '/' + submission.id, options)).status).toBe(200);
  expect(submissions.correct).toHaveBeenCalledWith({ id: 'owner' }, submission.id, { revision: 1 });
  submissions.get.mockRejectedValueOnce(new Error('private storage path'));
  const failure = await fetch(base + '/' + submission.id);
  expect(failure.status).toBe(503);
  expect(await failure.text()).not.toContain('private storage path');
  const invalid = await fetch(base, { ...options, method: 'POST', body: '{' });
  expect(invalid.status).toBe(400);
});
