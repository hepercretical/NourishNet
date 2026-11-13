import { expect, it, vi } from 'vitest';
import { foodRepository } from './foods.js';

it('uses bound literal case-insensitive matching, stable ordering and a fixed result bound', async () => {
  const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
  const query = "  OATS%' OR 1=1 --_  ";
  expect(await foodRepository(database).search(query)).toEqual([]);
  const [sql, values] = database.query.mock.calls[0];
  expect(sql).toContain('position(lower($1) in lower(f.name))');
  expect(sql).toContain('f.catalog_active = true');
  expect(sql).toContain("f.provenance <> 'synthetic'");
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

it('looks up the canonical barcode with bound parameters and all active serving choices', async () => {
  const row = {
    id: '79a0da43-8ab3-4c39-902f-cdf708d192ce',
    name: 'Quaker Old Fashioned Oats (18 oz canister)',
    serving_id: 'cd8c386f-c9a9-4b7d-8b47-e5e29c778ea6',
    serving_basis: '1/2 cup dry (40 g)',
    grams: '40',
    calories_kcal: '150',
    protein_g: '5',
    fat_g: '3',
    carbohydrates_g: '27',
    sodium_mg: '0',
  };
  const database = {
    query: vi.fn().mockResolvedValue({ rows: [row, { ...row, serving_id: 'second-serving' }] }),
  };
  const result = await foodRepository(database).lookupBarcode('030000010204');
  expect(result).toMatchObject({
    status: 'found',
    barcode: { input: '030000010204', gtin14: '00030000010204' },
  });
  expect(result.foods).toHaveLength(2);
  expect(result.foods[0]).toMatchObject({
    id: row.id,
    servingId: row.serving_id,
    nutrients: { calories: 150, sodium: 0 },
  });
  const [sql, values] = database.query.mock.calls[0];
  expect(values).toEqual(['00030000010204']);
  expect(sql).toContain('b.gtin14 = $1');
  expect(sql).toContain('f.catalog_active = true');
  expect(sql).toContain("f.provenance <> 'synthetic'");
  expect(sql).not.toMatch(/INSERT|UPDATE|DELETE/);
});

it('returns a recoverable unknown result without inserting a food or diary entry', async () => {
  const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
  expect(await foodRepository(database).lookupBarcode('6291041500213')).toEqual({
    status: 'unknown',
    barcode: { input: '6291041500213', gtin14: '06291041500213' },
    foods: [],
  });
  expect(database.query).toHaveBeenCalledOnce();
});

it('rejects invalid barcode input before SQL and propagates lookup failures for recovery', async () => {
  const database = { query: vi.fn().mockRejectedValue(new Error('read failed')) };
  await expect(foodRepository(database).lookupBarcode('030000010205')).rejects.toMatchObject({
    status: 400,
  });
  expect(database.query).not.toHaveBeenCalled();
  await expect(foodRepository(database).lookupBarcode('030000010204')).rejects.toThrow(
    'read failed',
  );
});
