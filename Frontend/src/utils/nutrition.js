const nutrientNames = ['calories', 'protein', 'fat', 'carbohydrates', 'sodium'];

export function scaleNutrition(nutrients, amount) {
  if (!Number.isFinite(amount) || amount <= 0) throw new RangeError('Invalid serving amount');
  return Object.fromEntries(
    nutrientNames.map((key) => {
      const value = nutrients[key];
      if (value == null) return [key, null];
      const scaled = value * amount;
      if (!Number.isFinite(value) || value < 0 || !Number.isFinite(scaled))
        throw new RangeError('Nutrition cannot be scaled');
      return [key, scaled];
    }),
  );
}

// Keep calculation precision in state; show at most two decimal places in this flow.
export function displayNutrition(nutrients) {
  return Object.fromEntries(
    Object.entries(nutrients).map(([key, value]) => [
      key,
      value == null ? null : Number(value.toFixed(2)),
    ]),
  );
}
