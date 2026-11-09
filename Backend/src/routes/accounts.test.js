import { once } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { createAuthService } from '../auth/service.js';
import { testRepository } from '../auth/testRepository.js';

let server;
afterEach(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});
async function setup() {
  const repository = testRepository(),
    messages = [];
  const foods = { search: vi.fn().mockResolvedValue([]) };
  const auth = createAuthService({
    repository,
    deliver: async (message) => messages.push(message),
  });
  server = createApp({ services: { auth, foods } });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (action, body, cookie) =>
    fetch(`${base}/api/auth/${action}`, {
      method: 'POST',
      headers: {
        Origin: 'http://127.0.0.1:5173',
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
  const signup = {
    email: 'avery@example.test',
    password: 'fictional-only-password',
    displayName: 'Avery Fiction',
    adult: true,
    timeZone: 'America/Denver',
  };
  async function login() {
    await post('signup', signup);
    await post('verify', { email: signup.email, code: messages[0].code });
    return post('login', signup);
  }
  return { base, post, login, foods, repository };
}
it('requires the local origin for mutations and restricts HTTP methods', async () => {
  const { base } = await setup();
  expect((await fetch(`${base}/api/auth/signup`, { method: 'POST' })).status).toBe(403);
  const response = await fetch(`${base}/api/auth/login`);
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('POST');
});
it('requires a valid session before catalog or diary access', async () => {
  const { base, foods } = await setup();
  for (const path of ['/foods', '/dashboard', '/auth/session']) {
    const response = await fetch(`${base}/api${path}`);
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  }
  expect(foods.search).not.toHaveBeenCalled();
});
it('sets an HttpOnly strict cookie without exposing the token in JSON, returns the owner and clears logout', async () => {
  const { base, login, post } = await setup();
  const response = await login();
  expect(response.status).toBe(200);
  const cookie = response.headers.get('set-cookie');
  expect(cookie).toContain('HttpOnly; SameSite=Strict; Path=/api');
  const body = await response.json();
  expect(body.sessionToken).toBeUndefined();
  const diary = await fetch(`${base}/api/dashboard`, { headers: { Cookie: cookie.split(';')[0] } });
  expect(await diary.json()).toMatchObject({
    accountId: body.account.id,
    sharing: false,
    goal: null,
    meals: [
      { name: 'Breakfast', entries: [] },
      { name: 'Lunch', entries: [] },
      { name: 'Dinner', entries: [] },
      { name: 'Snack', entries: [] },
    ],
  });
  const logout = await post('logout', {}, cookie.split(';')[0]);
  expect(logout.status).toBe(204);
  expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');
  expect(
    (await fetch(`${base}/api/dashboard`, { headers: { Cookie: cookie.split(';')[0] } })).status,
  ).toBe(401);
});
it('bounds food search before querying and returns predictable no-match results', async () => {
  const { base, login, foods } = await setup();
  const response = await login();
  const headers = { Cookie: response.headers.get('set-cookie').split(';')[0] };
  expect((await fetch(`${base}/api/foods?q=${'x'.repeat(101)}`, { headers })).status).toBe(400);
  expect(foods.search).not.toHaveBeenCalled();
  const result = await fetch(`${base}/api/foods?q=OATS`, { headers });
  expect(await result.json()).toEqual({ foods: [] });
  expect(foods.search).toHaveBeenCalledWith('OATS');
});
it('returns a safe failure without exposing service diagnostics', async () => {
  const { base, login, foods } = await setup();
  const response = await login();
  foods.search.mockRejectedValue(new Error('private SQL connection diagnostic'));
  const failure = await fetch(`${base}/api/foods?q=oats`, {
    headers: { Cookie: response.headers.get('set-cookie').split(';')[0] },
  });
  expect(failure.status).toBe(503);
  expect(await failure.text()).not.toContain('private SQL');
});
