import { once } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { AccountError } from '../auth/service.js';
let server;
afterEach(async () => {
  if (server?.listening) await new Promise((r) => server.close(r));
});
async function setup(signedIn = true) {
  const personal = {
    getGoal: vi.fn().mockResolvedValue({ goal: null }),
    saveAppearance: vi.fn().mockResolvedValue({ mode: 'light', accent: 'blue', revision: 1 }),
  };
  server = createApp({
    services: {
      auth: {
        session: vi.fn(async () => {
          if (!signedIn) throw new AccountError('Sign in', 401);
          return { id: 'owner' };
        }),
      },
      personal,
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { personal, base: `http://127.0.0.1:${server.address().port}/api/personal` };
}
it('requires a session and never accepts a caller-supplied owner', async () => {
  const { base, personal } = await setup(false);
  expect((await fetch(base + '/goals?date=2026-11-12')).status).toBe(401);
  expect(personal.getGoal).not.toHaveBeenCalled();
});
it('returns no-store owned goals and rejects repeated/extra query fields', async () => {
  const { base, personal } = await setup();
  const r = await fetch(base + '/goals?date=2026-11-12');
  expect(r.headers.get('cache-control')).toBe('no-store');
  expect(await r.json()).toEqual({ goal: null });
  expect(personal.getGoal).toHaveBeenCalledWith({ id: 'owner' }, '2026-11-12');
  for (const query of ['?date=a&date=b', '?date=a&owner=other', ''])
    expect((await fetch(base + '/goals' + query)).status).toBe(400);
});
it('enforces origin, JSON and methods before a personal mutation', async () => {
  const { base, personal } = await setup();
  expect((await fetch(base + '/appearance', { method: 'PUT', body: '{}' })).status).toBe(403);
  expect(
    (
      await fetch(base + '/appearance', {
        method: 'PUT',
        headers: { origin: 'http://127.0.0.1:5173' },
        body: '{}',
      })
    ).status,
  ).toBe(415);
  const body = { mode: 'light', accent: 'blue', revision: 0, requestKey: 'key' };
  expect(
    (
      await fetch(base + '/appearance', {
        method: 'PUT',
        headers: { origin: 'http://127.0.0.1:5173', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    ).status,
  ).toBe(200);
  expect(personal.saveAppearance).toHaveBeenCalledWith({ id: 'owner' }, body);
  expect((await fetch(base + '/stats', { method: 'DELETE' })).status).toBe(405);
});
it('keeps unexpected diagnostics out of the response', async () => {
  const { base, personal } = await setup();
  personal.getGoal.mockRejectedValue(new Error('private password diagnostics'));
  const r = await fetch(base + '/goals?date=2026-11-12');
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain('password diagnostics');
});
