import { afterEach, expect, it, vi } from 'vitest';
import { accountRequest } from './accounts.js';
afterEach(() => vi.unstubAllGlobals());
it('uses same-origin cookies and JSON for mutations without storing browser tokens', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ account: { id: 'synthetic' } }),
  });
  vi.stubGlobal('fetch', fetch);
  await accountRequest('/auth/login', { body: { email: 'avery@example.test' } });
  expect(fetch).toHaveBeenCalledWith(
    '/api/auth/login',
    expect.objectContaining({
      credentials: 'same-origin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }),
  );
});
it('clears private UI on a protected 401 and hides raw backend diagnostics', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'SQL secret' }) }),
  );
  const expired = vi.fn();
  window.addEventListener('nourishnet:expired', expired);
  try {
    await expect(accountRequest('/dashboard')).rejects.toThrow('session expired');
    expect(expired).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener('nourishnet:expired', expired);
  }
});

it.each(['PATCH', 'DELETE'])(
  'sends authenticated %s entry changes with JSON and cancellation',
  async (method) => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ date: '2026-11-09' }) });
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const body = { date: '2026-11-09', revision: 1, requestKey: 'synthetic-key' };
    await accountRequest('/diary/entries/synthetic', { method, body, signal: controller.signal });
    expect(fetch).toHaveBeenCalledWith(
      '/api/diary/entries/synthetic',
      expect.objectContaining({
        method,
        credentials: 'same-origin',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },
);
it('preserves a revision conflict status without exposing backend diagnostics', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'private diagnostics' }),
    }),
  );
  await expect(
    accountRequest('/diary/entries/synthetic', { method: 'PATCH', body: {} }),
  ).rejects.toMatchObject({ status: 409 });
});
