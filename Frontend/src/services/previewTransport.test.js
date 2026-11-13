import { afterEach, expect, it, vi } from 'vitest';
import { getPreviewTransport, installPreviewTransport } from './previewTransport.js';
afterEach(() => vi.unstubAllEnvs());
it('requires explicit test-harness registration and removes it on leaving', () => {
  expect(getPreviewTransport()).toBeUndefined();
  const fn = vi.fn();
  const remove = installPreviewTransport(fn);
  expect(getPreviewTransport()).toBe(fn);
  remove();
  expect(getPreviewTransport()).toBeUndefined();
});
it('ignores registration in production', () => {
  vi.stubEnv('DEV', false);
  const remove = installPreviewTransport(vi.fn());
  expect(getPreviewTransport()).toBeUndefined();
  remove();
});
