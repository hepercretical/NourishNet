import { accountRequest } from './accounts.js';

export async function lookupBarcode(code, { signal } = {}) {
  if (typeof code !== 'string' || !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code.trim()))
    throw Object.assign(new Error('Enter an 8, 12, 13 or 14 digit barcode.'), { status: 400 });
  let result;
  try {
    result = await accountRequest(`/foods/barcode?${new URLSearchParams({ code: code.trim() })}`, {
      signal,
    });
  } catch (error) {
    if (error.status === 400)
      throw Object.assign(
        new Error(
          'Check every barcode digit, including any leading zeros and the final check digit.',
        ),
        { status: 400 },
      );
    throw error;
  }
  if (
    !['found', 'unknown'].includes(result?.status) ||
    result?.barcode?.input !== code.trim() ||
    result?.barcode?.gtin14 !== code.trim().padStart(14, '0') ||
    !Array.isArray(result?.foods) ||
    (result.status === 'found' && !result.foods.length) ||
    (result.status === 'unknown' && result.foods.length)
  )
    throw new Error('The barcode result could not be read. Try again.');
  return result;
}

export async function searchFoods(query, { signal } = {}) {
  if (typeof query !== 'string' || query.length > 100)
    throw new Error('Use at most 100 search characters.');
  const term = query.trim();
  if (!term) return [];
  const result = await accountRequest(`/foods?${new URLSearchParams({ q: term })}`, { signal });
  if (!Array.isArray(result?.foods)) throw new Error('Foods could not be loaded. Try again.');
  return result.foods;
}
