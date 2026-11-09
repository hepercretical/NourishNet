export function foodRepository(database) {
  return {
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
        WHERE position(lower($1) in lower(f.name)) > 0
        ORDER BY lower(f.name), f.id, s.id LIMIT 25`,
        [term],
      );
      return result.rows.map((row) => ({
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
      }));
    },
  };
}
