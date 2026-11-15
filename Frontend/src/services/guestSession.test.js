import { afterEach, expect, it, vi } from 'vitest';
import { setGuestSession, usesGuestSession } from './guestSession.js';
afterEach(() => {
  vi.unstubAllGlobals();
  setGuestSession(false);
});
it('remembers explicit guest entry across module reloads and clears it on exit', async () => {
  setGuestSession(true);
  vi.resetModules();
  const fresh = await import('./guestSession.js');
  expect(fresh.usesGuestSession()).toBe(true);
  fresh.setGuestSession(false);
  setGuestSession(false);
  expect(usesGuestSession()).toBe(false);
});
it('keeps the current guest usable if browser storage is blocked', () => {
  vi.stubGlobal('sessionStorage', {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
    removeItem() {
      throw new Error();
    },
  });
  setGuestSession(true);
  expect(usesGuestSession()).toBe(true);
  setGuestSession(false);
  expect(usesGuestSession()).toBe(false);
});
