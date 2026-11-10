import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { demoRequest, isLocalDemo } from './localDemo.js';

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});
const draft = {
  date: '2026-11-09',
  quantity: 1.5,
  meal: 'lunch',
  servingId: 'demo-yogurt',
  requestKey: 'one',
};
it('requires explicit development opt-in and is disabled in production', () => {
  window.history.replaceState({}, '', '/?demo=1');
  expect(isLocalDemo()).toBe(true);
  vi.stubEnv('DEV', false);
  expect(isLocalDemo()).toBe(false);
});
it('searches case-insensitively, replays saves once and preserves unknown nutrients and empty days', async () => {
  expect((await demoRequest('/foods?q=YOGURT')).foods).toHaveLength(1);
  expect((await demoRequest('/foods?q=no-match')).foods).toEqual([]);
  await demoRequest('/diary', { body: draft });
  await demoRequest('/diary', { body: draft });
  const diary = await demoRequest('/diary?date=2026-11-09');
  expect(diary.meals[1].entries).toHaveLength(1);
  expect(diary.totals).toMatchObject({ calories: 150, sodium: null });
  expect((await demoRequest('/diary?date=2026-11-08')).totals.calories).toBe(0);
  await expect(demoRequest('/diary', { body: { ...draft, quantity: 2 } })).rejects.toThrow();
});
it('rejects stale edits and cancelled saves without changing data', async () => {
  const saved = await demoRequest('/diary', { body: draft });
  await expect(
    demoRequest(`/diary/entries/${saved.entry.id}`, {
      method: 'PATCH',
      body: { ...draft, revision: 99, requestKey: 'edit' },
    }),
  ).rejects.toMatchObject({ status: 409 });
  const controller = new AbortController();
  controller.abort();
  await expect(
    demoRequest('/diary', { body: { ...draft, requestKey: 'cancel' }, signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect((await demoRequest('/diary?date=2026-11-09')).meals[1].entries).toHaveLength(1);
});
