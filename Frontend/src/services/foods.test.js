import { afterEach, expect, it, vi } from 'vitest';
import { searchFoods } from './foods.js';

afterEach(() => vi.unstubAllGlobals());

it('encodes literal search text and forwards cancellation with same-origin cookies', async () => {
  const foods = [{ id: 'synthetic', servingId: 'serving', name: 'Oats' }];
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ foods }) });
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  expect(await searchFoods('  oats & %_  ', { signal: controller.signal })).toEqual(foods);
  expect(fetch).toHaveBeenCalledWith('/api/foods?q=oats+%26+%25_', {
    method: 'GET',
    credentials: 'same-origin',
    signal: controller.signal,
  });
});

it('avoids requests for blank or invalid searches', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  expect(await searchFoods('   ')).toEqual([]);
  await expect(searchFoods('a'.repeat(101))).rejects.toThrow('100');
  await expect(searchFoods(null)).rejects.toThrow('100');
  expect(fetch).not.toHaveBeenCalled();
});

it('handles empty results, malformed responses, failed requests and safe errors', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ foods: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: 'private SQL' }) })
    .mockRejectedValueOnce(new Error('private connection details'));
  vi.stubGlobal('fetch', fetch);
  expect(await searchFoods('oats')).toEqual([]);
  await expect(searchFoods('oats')).rejects.toThrow('Foods could not be loaded');
  await expect(searchFoods('oats')).rejects.toThrow('local service is unavailable');
  await expect(searchFoods('oats')).rejects.toThrow('Cannot reach the local API');
});

it('passes aborts through and announces expired authentication', async () => {
  const aborted = new DOMException('Aborted', 'AbortError');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockRejectedValueOnce(aborted).mockResolvedValueOnce({ ok: false, status: 401 }),
  );
  await expect(searchFoods('oats')).rejects.toBe(aborted);
  const expired = vi.fn();
  window.addEventListener('nourishnet:expired', expired);
  try {
    await expect(searchFoods('oats')).rejects.toThrow('session expired');
    expect(expired).toHaveBeenCalledOnce();
  } finally {
    window.removeEventListener('nourishnet:expired', expired);
  }
});
