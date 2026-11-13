import { expect, it } from 'vitest';
import { isAppRoute } from './appRoutes.js';
it.each([
  '/app/dashboard',
  '/app/login',
  '/app/search/Lunch',
  '/app/scan/Dinner',
  '/app/submissions/new',
  '/app/submissions/cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '/app/settings',
])('accepts implemented destination %s', (route) => expect(isAppRoute(route)).toBe(true));
it.each([
  '/design',
  '/privacy',
  '/app/goals',
  '/app/search/Brunch',
  '/app/submissions/not-an-id',
  '/app/settings/rights',
])('rejects preview, unfinished and malformed destination %s', (route) =>
  expect(isAppRoute(route)).toBe(false),
);
