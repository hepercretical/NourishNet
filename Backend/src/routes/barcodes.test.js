import { once } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { AccountError } from '../auth/service.js';

let server;
afterEach(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
});
async function setup({ signedIn = true, failure = false } = {}) {
  const result = {
    status: 'unknown',
    barcode: { input: '6291041500213', gtin14: '06291041500213' },
    foods: [],
  };
  const lookupBarcode = vi.fn(async () => {
    if (failure) throw new Error('private database diagnostics');
    return result;
  });
  server = createApp({
    services: {
      auth: {
        session: vi.fn(async () => {
          if (!signedIn) throw new AccountError('Sign in again.', 401);
          return { id: 'test-owner' };
        }),
      },
      foods: { lookupBarcode },
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    lookupBarcode,
    result,
    base: `http://127.0.0.1:${server.address().port}/api/foods/barcode`,
  };
}
it('returns an explicit no-store unknown result without a diary mutation', async () => {
  const { base, result, lookupBarcode } = await setup();
  const response = await fetch(`${base}?code=6291041500213`);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual(result);
  expect(lookupBarcode).toHaveBeenCalledExactlyOnceWith('6291041500213');
});
it.each(['', '?code=1&code=2', '?code=1&accountId=other', '?barcode=1'])(
  'rejects missing, repeated or extra query fields %s before lookup',
  async (query) => {
    const { base, lookupBarcode } = await setup();
    expect((await fetch(base + query)).status).toBe(400);
    expect(lookupBarcode).not.toHaveBeenCalled();
  },
);
it('requires the existing signed-in session', async () => {
  const { base, lookupBarcode } = await setup({ signedIn: false });
  expect((await fetch(base + '?code=6291041500213')).status).toBe(401);
  expect(lookupBarcode).not.toHaveBeenCalled();
});
it('offers retry without returning database diagnostics', async () => {
  const { base } = await setup({ failure: true });
  const response = await fetch(base + '?code=6291041500213');
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private database diagnostics');
});
it('allows GET only and never runs lookup for a mutation request', async () => {
  const { base, lookupBarcode } = await setup();
  const response = await fetch(base + '?code=6291041500213', { method: 'POST' });
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('GET');
  expect(lookupBarcode).not.toHaveBeenCalled();
});
