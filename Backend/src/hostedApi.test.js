import { beforeEach, expect, it, vi } from 'vitest';
import { createHostedApi } from './hostedApi.js';
import { AccountError } from './auth/service.js';
import { createAuthService } from './auth/service.js';
import { testRepository } from './auth/testRepository.js';
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
it('requires explicit hosted guest enablement before any account is created', async () => {
  expect((await api(request('/auth/guest', {}))).status).toBe(404);
  expect(verify).not.toHaveBeenCalled();
});
it('creates isolated hosted guests with private cookies, refresh and revocable logout', async () => {
  services.guestAuth = createAuthService({ repository: testRepository(), allowGuest: true });
  api = createHostedApi({ verify, getServices: () => services, origin, allowGuest: true });
  expect((await api(request('/auth/guest', {}, 'POST', 'https://wrong.test'))).status).toBe(403);
  const first = await api(request('/auth/guest', {}));
  expect(first.status).toBe(200);
  expect(first.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Strict');
  const firstBody = await first.json();
  expect(firstBody.sessionToken).toBeUndefined();
  const second = await api(request('/auth/guest', {}));
  const secondBody = await second.json();
  expect(firstBody.account.id).not.toBe(secondBody.account.id);
  const cookie = first.headers.get('set-cookie').split(';')[0];
  const secondCookie = second.headers.get('set-cookie').split(';')[0];
  const withCookie = (path, value, body) => {
    const req = request(path, body);
    req.headers.set('Cookie', value);
    return req;
  };
  expect(await (await api(withCookie('/auth/session', cookie))).json()).toMatchObject(firstBody);
  await api(withCookie('/diary?date=2026-11-13', cookie));
  await api(withCookie('/diary?date=2026-11-13', secondCookie));
  expect(services.diary.get.mock.calls.map(([owner]) => owner.id)).toEqual([
    firstBody.account.id,
    secondBody.account.id,
  ]);
  expect(verify).not.toHaveBeenCalled();
  const managed = withCookie('/auth/session', cookie);
  managed.headers.set('Authorization', 'Bearer managed-test-token');
  expect(await (await api(managed)).json()).toMatchObject({ account });
  expect(verify).toHaveBeenCalledOnce();
  const logout = await api(withCookie('/auth/logout', cookie, {}));
  expect(logout.status).toBe(204);
  expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');
  expect((await api(withCookie('/auth/session', cookie))).status).toBe(401);
  expect((await api(withCookie('/auth/session', 'nourishnet_guest=forged'))).status).toBe(401);
  expect((await api(withCookie('/auth/session', secondCookie))).status).toBe(200);
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

it('supports barcode lookup without creating a diary entry', async () => {
  services.foods.lookupBarcode = vi.fn().mockResolvedValue({ known: true });
  expect((await api(request('/foods/barcode?code=811620022118'))).status).toBe(200);
  expect(services.foods.lookupBarcode).toHaveBeenCalledWith('811620022118');
  expect((await api(request('/foods/barcode?code=1&code=2'))).status).toBe(400);
  expect(services.diary.create).not.toHaveBeenCalled();
});
it('binds hosted personal and submission actions to the resolved owner', async () => {
  services.personal = {
    getGoal: vi.fn().mockResolvedValue({ goal: null }),
    saveGoal: vi.fn().mockResolvedValue({ saved: true }),
  };
  services.submissions = {
    list: vi.fn().mockResolvedValue([]),
    photo: vi.fn().mockResolvedValue({ mime: 'image/png', bytes: Buffer.from('private image') }),
  };
  expect((await api(request('/personal/goals?date=2026-11-13'))).status).toBe(200);
  expect(services.personal.getGoal).toHaveBeenCalledWith(account, '2026-11-13');
  expect((await api(request('/personal/goals?date=a&date=b'))).status).toBe(400);
  expect((await api(request('/personal/password', {}))).status).toBe(404);
  expect((await api(request('/submissions'))).status).toBe(200);
  expect(services.submissions.list).toHaveBeenCalledWith(account);
  const response = await api(
    request('/submissions/11111111-1111-4111-8111-111111111111/photos/front'),
  );
  expect(response.headers.get('content-type')).toBe('image/png');
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  expect(await response.text()).toBe('private image');
});
