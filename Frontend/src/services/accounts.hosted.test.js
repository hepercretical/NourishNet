import { afterEach, expect, it, vi } from 'vitest';
const { neonToken, neonAuthRequest } = vi.hoisted(() => ({
  neonToken: vi.fn(),
  neonAuthRequest: vi.fn(),
}));
vi.mock('./hostedConfig.js', () => ({ usesNeonAuth: true }));
vi.mock('./neonAuth.js', () => ({ neonToken, neonAuthRequest }));
import { accountRequest } from './accounts.js';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it('attaches the verified managed session token to same-origin API calls', async () => {
  neonToken.mockResolvedValue('synthetic-jwt');
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({ foods: [] }) });
  vi.stubGlobal('fetch', fetch);
  await accountRequest('/foods?q=oats');
  expect(fetch).toHaveBeenCalledWith(
    '/api/foods?q=oats',
    expect.objectContaining({
      headers: { Authorization: 'Bearer synthetic-jwt' },
      credentials: 'same-origin',
    }),
  );
});
it('uses the Neon login then resolves the private application profile from the API', async () => {
  neonAuthRequest.mockResolvedValue({ signedIn: true });
  neonToken.mockResolvedValue('synthetic-jwt');
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ account: null, needsProfile: true }),
  });
  vi.stubGlobal('fetch', fetch);
  expect(
    await accountRequest('/auth/login', {
      body: { email: 'test@example.test', password: 'test-only' },
    }),
  ).toEqual({ account: null, needsProfile: true });
  expect(neonAuthRequest).toHaveBeenCalledWith(
    '/auth/login',
    expect.objectContaining({ email: 'test@example.test' }),
  );
  expect(fetch).toHaveBeenCalledWith(
    '/api/auth/session',
    expect.objectContaining({ method: 'GET' }),
  );
});
it('never falls back to local cookies when Neon has no session', async () => {
  neonToken.mockResolvedValue(undefined);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const expired = vi.fn();
  window.addEventListener('nourishnet:expired', expired);
  try {
    await expect(accountRequest('/diary?date=2026-11-11')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener('nourishnet:expired', expired);
  }
});
