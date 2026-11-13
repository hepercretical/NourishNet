import { normalizeBarcode } from './barcodes.js';

function foodResult(row) {
  return {
    id: row.id,
    name: row.name,
    servingId: row.serving_id,
    servingBasis: row.serving_basis,
    grams: row.grams === null ? null : Number(row.grams),
    nutrients: {
      calories: Number(row.calories_kcal),
      protein: Number(row.protein_g),
      fat: Number(row.fat_g),
      carbohydrates: Number(row.carbohydrates_g),
      sodium: row.sodium_mg === null ? null : Number(row.sodium_mg),
    },
  };
}

export function foodRepository(database) {
  return {
    async lookupBarcode(value) {
      const barcode = normalizeBarcode(value);
      const result = await database.query(
        `SELECT f.id, f.name, s.id AS serving_id, s.label AS serving_basis, s.grams,
         s.calories_kcal, s.protein_g, s.fat_g, s.carbohydrates_g, s.sodium_mg
         FROM food_barcodes b JOIN foods f ON f.id = b.food_id
         JOIN food_servings s ON s.food_id = f.id
         WHERE b.gtin14 = $1 AND f.catalog_active = true AND f.provenance <> 'synthetic'
         ORDER BY s.id`,
        [barcode.gtin14],
      );
      const foods = result.rows.map(foodResult);
      return { status: foods.length ? 'found' : 'unknown', barcode, foods };
    },
    async search(query) {
      if (typeof query !== 'string' || query.length > 100)
        throw new TypeError('Search text must have at most 100 characters.');
      const term = query.trim();
      if (!term) return [];
      // position treats %, _ and backslashes as literal text, not LIKE patterns.
      const result = await database.query(
        `SELECT f.id, f.name, s.id AS serving_id, s.label AS serving_basis, s.grams,
        s.calories_kcal, s.protein_g, s.fat_g, s.carbohydrates_g, s.sodium_mg
        FROM foods f JOIN food_servings s ON s.food_id = f.id
        WHERE f.catalog_active = true AND f.provenance <> 'synthetic'
        AND position(lower($1) in lower(f.name)) > 0
        ORDER BY lower(f.name), f.id, s.id LIMIT 25`,
        [term],
      );
      return result.rows.map(foodResult);
    },
  };
}
