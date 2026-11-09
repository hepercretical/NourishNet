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
