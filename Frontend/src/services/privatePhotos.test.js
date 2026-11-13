import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadPrivatePhoto } from './privatePhotos.js';
import { neonToken } from './neonAuth.js';
import { setGuestSession } from './guestSession.js';
afterEach(() => setGuestSession(false));
vi.mock('./neonAuth.js', () => ({ neonToken: vi.fn() }));
const path = '/api/submissions/11111111-1111-4111-8111-111111111111/photos/front';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  neonToken.mockResolvedValue('mock-jwt');
});
it('retrieves a guest-owned photo with its private cookie instead of requesting a Neon token', async () => {
  setGuestSession(true);
  fetch.mockResolvedValue(new Response('image', { headers: { 'Content-Type': 'image/png' } }));
  expect((await loadPrivatePhoto(path)).size).toBe(5);
  expect(neonToken).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledWith(
    path,
    expect.objectContaining({ credentials: 'same-origin', redirect: 'error' }),
  );
  expect(fetch.mock.calls[0][1].headers).toBeUndefined();
});
it('sends the bearer only to an owned same-origin photo path and returns a bounded blob', async () => {
  fetch.mockResolvedValue(new Response('image', { headers: { 'Content-Type': 'image/png' } }));
  expect((await loadPrivatePhoto(path)).size).toBe(5);
  expect(fetch).toHaveBeenCalledWith(
    path,
    expect.objectContaining({
      cache: 'no-store',
      redirect: 'error',
      headers: { Authorization: 'Bearer mock-jwt' },
    }),
  );
  await expect(loadPrivatePhoto('https://external.test' + path)).rejects.toThrow(
    'Invalid photo address',
  );
  expect(fetch).toHaveBeenCalledOnce();
});
it('rejects missing sessions, forbidden responses, wrong types and oversized streams', async () => {
  neonToken.mockResolvedValueOnce(null);
  await expect(loadPrivatePhoto(path)).rejects.toThrow('Sign in');
  expect(fetch).not.toHaveBeenCalled();
  for (const response of [
    new Response('private', { status: 403 }),
    new Response('<html>', { headers: { 'Content-Type': 'text/html' } }),
    new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'image/png' } }),
  ]) {
    fetch.mockResolvedValueOnce(response);
    await expect(loadPrivatePhoto(path)).rejects.toThrow();
  }
});
