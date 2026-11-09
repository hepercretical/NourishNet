import { accountRequest } from './accounts.js';

export async function searchFoods(query, { signal } = {}) {
  if (typeof query !== 'string' || query.length > 100)
    throw new Error('Use at most 100 search characters.');
  const term = query.trim();
  if (!term) return [];
  const result = await accountRequest(`/foods?${new URLSearchParams({ q: term })}`, { signal });
  if (!Array.isArray(result?.foods)) throw new Error('Foods could not be loaded. Try again.');
  return result.foods;
}
