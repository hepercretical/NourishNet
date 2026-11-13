const simple = new Set([
  'app',
  'app/dashboard',
  'app/search',
  'app/scan',
  'app/submissions',
  'app/submissions/new',
  'app/settings',
  'app/login',
  'app/signup',
  'app/verify',
  'app/recover',
  'app/reset',
  'app/profile',
]);
export function isAppRoute(route) {
  if (typeof route !== 'string' || !route.startsWith('/')) return false;
  const path = route.slice(1);
  if (simple.has(path)) return true;
  if (/^app\/(?:search|scan)\/(?:Breakfast|Lunch|Dinner|Snack)$/.test(path)) return true;
  return /^app\/submissions\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    path,
  );
}
