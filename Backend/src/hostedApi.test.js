import { beforeEach, expect, it, vi } from 'vitest';
import { createHostedApi } from './hostedApi.js';
import { AccountError } from './auth/service.js';
import handler from '../../netlify/functions/api.mjs';

const origin = 'https://app.example.test';
const identity = { issuer: 'issuer', subject: 'actor' };
const account = { id: 'private-owner', displayName: 'Test Actor', timeZone: 'America/Denver' };
let services, verify, api;
beforeEach(() => {
  services = {
    accounts: {
      find: vi.fn().mockResolvedValue(account),
      onboard: vi.fn().mockResolvedValue(account),
    },
    foods: { search: vi.fn().mockResolvedValue([]) },
    diary: {
      get: vi.fn().mockResolvedValue({ date: '2026-11-11' }),
      create: vi.fn().mockResolvedValue({ saved: true }),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
  verify = vi.fn().mockResolvedValue(identity);
  api = createHostedApi({ verify, getServices: () => services, origin });
});
function request(path, body, method = body ? 'POST' : 'GET', from = origin) {
  return new Request(`${origin}/api${path}`, {
    method,
    headers: { Origin: from, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
it('serves hosted health without any credentials or database', async () => {
  expect(await (await handler(request('/health'))).json()).toEqual({ status: 'ok' });
  expect(verify).not.toHaveBeenCalled();
});
it('rejects methods and unknown routes without authenticating or loading services', async () => {
  expect((await api(request('/missing'))).status).toBe(404);
  expect((await api(request('/health', {}, 'POST'))).status).toBe(405);
  expect(verify).not.toHaveBeenCalled();
});
it('requires verified identity and keeps diagnostics private', async () => {
  verify.mockRejectedValueOnce(new AccountError('Sign in again.', 401));
  expect((await api(request('/auth/session'))).status).toBe(401);
  expect(services.accounts.find).not.toHaveBeenCalled();
  verify.mockRejectedValueOnce(new Error('sensitive diagnostic'));
  const response = await api(request('/auth/session'));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('sensitive diagnostic');
});
it('requests onboarding before allowing diary access for a new identity', async () => {
  services.accounts.find.mockResolvedValue(null);
  expect(await (await api(request('/auth/session'))).json()).toEqual({
    account: null,
    needsProfile: true,
  });
  expect((await api(request('/diary?date=2026-11-11'))).status).toBe(403);
  expect(services.diary.get).not.toHaveBeenCalled();
});
it('passes only the resolved account into diary operations and preserves selected dates', async () => {
  const response = await api(request('/diary?date=2026-11-11'));
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(services.accounts.find).toHaveBeenCalledWith(identity);
  expect(services.diary.get).toHaveBeenCalledWith(account, '2026-11-11');
  expect((await api(request('/diary?date=a&date=b'))).status).toBe(400);
});
it('rejects cross-origin writes and oversized JSON while preserving mutation contracts', async () => {
  expect((await api(request('/diary', {}, 'POST', 'https://wrong.test'))).status).toBe(403);
  expect(verify).not.toHaveBeenCalled();
  expect((await api(request('/diary', { data: 'x'.repeat(9000) }))).status).toBe(413);
  const body = { date: '2026-11-11', meal: 'lunch' };
  expect((await api(request('/diary', body))).status).toBe(201);
  expect(services.diary.create).toHaveBeenCalledWith(account, body);
});
it('saves profile choices against the verified identity only', async () => {
  const body = { adult: true, displayName: 'Fiction', timeZone: 'America/Denver' };
  expect((await api(request('/auth/profile', body))).status).toBe(200);
  expect(services.accounts.onboard).toHaveBeenCalledWith(identity, body);
});

it('resolves separate verified actors for each request instead of caching a previous owner', async () => {
  const other = { ...account, id: 'other-owner' };
  verify
    .mockResolvedValueOnce(identity)
    .mockResolvedValueOnce({ issuer: 'issuer', subject: 'other-actor' });
  services.accounts.find.mockResolvedValueOnce(account).mockResolvedValueOnce(other);
  await api(request('/diary?date=2026-11-11'));
  await api(request('/diary?date=2026-11-11'));
  expect(services.diary.get.mock.calls.map(([owner]) => owner.id)).toEqual([
    'private-owner',
    'other-owner',
  ]);
});
