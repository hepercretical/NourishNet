import { expect, it, vi } from 'vitest';
import { foodRepository } from './foods.js';

it('uses bound literal case-insensitive matching, stable ordering and a fixed result bound', async () => {
  const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
  const query = "  OATS%' OR 1=1 --_  ";
  expect(await foodRepository(database).search(query)).toEqual([]);
  const [sql, values] = database.query.mock.calls[0];
  expect(sql).toContain('position(lower($1) in lower(f.name))');
  expect(sql).toContain('ORDER BY lower(f.name), f.id, s.id LIMIT 25');
  expect(sql).not.toContain(query.trim());
  expect(values).toEqual([query.trim()]);
});
it.each(['', ' ', '\n'])(
  'returns predictable empty results for %j without a query',
  async (query) => {
    const database = { query: vi.fn() };
    expect(await foodRepository(database).search(query)).toEqual([]);
    expect(database.query).not.toHaveBeenCalled();
  },
);
it('validates query type and length before accessing the database', async () => {
  const database = { query: vi.fn() };
  for (const query of [null, {}, 'x'.repeat(101)])
    await expect(foodRepository(database).search(query)).rejects.toThrow('100 characters');
  expect(database.query).not.toHaveBeenCalled();
});
it('returns food/serving identity, units and decimal values while preserving zero and unknown sodium', async () => {
  const row = {
    id: 'food',
    name: 'Synthetic oats',
    serving_id: 'serving',
    serving_basis: '40 g dry',
    grams: '40.0000',
    calories_kcal: '150.0000',
    protein_g: '5.5000',
    fat_g: '0.0000',
    carbohydrates_g: '27.0000',
    sodium_mg: null,
  };
  const database = {
    query: vi.fn().mockResolvedValue({ rows: [row, { ...row, sodium_mg: '0.0000' }] }),
  };
  const result = await foodRepository(database).search('oats');
  expect(result[0]).toMatchObject({
    servingBasis: '40 g dry',
    grams: 40,
    nutrients: { calories: 150, protein: 5.5, fat: 0, carbohydrates: 27, sodium: null },
  });
  expect(result[1].nutrients.sodium).toBe(0);
});
