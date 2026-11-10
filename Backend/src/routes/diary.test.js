import { once } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { AccountError } from '../auth/service.js';
import { diaryDraft } from '../db/diary.js';

let server;
afterEach(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});
async function setup() {
  const account = { id: 'synthetic-owner', timeZone: 'Pacific/Auckland' };
  const diary = {
    get: vi.fn().mockResolvedValue({ date: '2026-11-01', meals: [] }),
    create: vi.fn(async (_account, body) => ({
      date: diaryDraft(body).date,
      entry: { id: 'saved' },
    })),
  };
  const auth = {
    session: vi.fn(async (token) => {
      if (token !== 'valid') throw new AccountError('Sign in again.', 401);
      return account;
    }),
  };
  server = createApp({ services: { auth, diary } });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/diary`;
  const headers = {
    Cookie: 'nourishnet_session=valid',
    Origin: 'http://127.0.0.1:5173',
    'Content-Type': 'application/json',
  };
  const body = {
    date: '2026-11-01',
    meal: 'snack',
    quantity: 0.25,
    servingId: '20000000-0000-4000-8000-000000000001',
    requestKey: '30000000-0000-4000-8000-000000000001',
  };
  return { base, headers, diary, account, body };
}
it('requires an active session for reads and saves', async () => {
  const { base, diary, headers, body } = await setup();
  for (const options of [
    {},
    { method: 'POST', headers: { ...headers, Cookie: '' }, body: JSON.stringify(body) },
  ]) {
    const response = await fetch(`${base}?date=2026-11-01`, options);
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  }
  expect(diary.get).not.toHaveBeenCalled();
  expect(diary.create).not.toHaveBeenCalled();
});
it('passes only the session account and requested local date to retrieval', async () => {
  const { base, headers, diary, account } = await setup();
  const response = await fetch(`${base}?date=2026-11-01`, { headers });
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(diary.get).toHaveBeenCalledWith(account, '2026-11-01');
});
it.each(['', '?date=2026-11-01&date=2026-11-02', '?date=2026-11-01&accountId=other'])(
  'rejects missing/ambiguous/extra query fields %s',
  async (query) => {
    const { base, headers, diary } = await setup();
    expect((await fetch(base + query, { headers })).status).toBe(400);
    expect(diary.get).not.toHaveBeenCalled();
  },
);
it('creates an entry for the session account with a no-store response', async () => {
  const { base, headers, diary, account, body } = await setup();
  const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify(body) });
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ date: body.date, entry: { id: 'saved' } });
  expect(diary.create).toHaveBeenCalledWith(account, body);
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it('rejects foreign origins, unsupported methods, non-JSON and oversized bodies', async () => {
  const { base, headers, diary } = await setup();
  for (const [options, status] of [
    [{ method: 'POST', headers: { ...headers, Origin: 'https://other.invalid' } }, 403],
    [{ method: 'PUT', headers }, 405],
    [{ method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain' }, body: '{}' }, 415],
    [{ method: 'POST', headers, body: '{invalid' }, 400],
    [{ method: 'POST', headers, body: 'x'.repeat(8193) }, 413],
  ]) {
    const response = await fetch(base, options);
    expect(response.status).toBe(status);
    if (status === 405) expect(response.headers.get('allow')).toBe('GET, POST');
  }
  expect(diary.create).not.toHaveBeenCalled();
});
it('rejects forged ownership, nutrition and invalid quantities', async () => {
  const { base, headers, body } = await setup();
  for (const extra of [
    { accountId: 'other' },
    { timeZone: 'UTC' },
    { quantity: 0 },
    { nutrients: {} },
  ]) {
    expect(
      (await fetch(base, { method: 'POST', headers, body: JSON.stringify({ ...body, ...extra }) }))
        .status,
    ).toBe(400);
  }
});
it('returns retry conflicts and safe service errors', async () => {
  const { base, headers, diary } = await setup();
  diary.get.mockRejectedValueOnce(new AccountError('Save key conflict.', 409));
  expect((await fetch(`${base}?date=2026-11-01`, { headers })).status).toBe(409);
  diary.get.mockRejectedValue(new Error('private database credential diagnostic'));
  const response = await fetch(`${base}?date=2026-11-01`, { headers });
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private');
});
