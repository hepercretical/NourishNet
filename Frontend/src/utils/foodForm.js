export const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Form validation only; nutrition scaling and database limits belong to later plans.
export function validateServing(value) {
  const text = String(value).trim();
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) && Number.isFinite(Number(text)) && Number(text) > 0
    ? undefined
    : 'Enter a serving amount greater than zero, such as 1 or 1.5.';
}

export function validateMeal(value) {
  return meals.includes(value) ? undefined : 'Choose Breakfast, Lunch, Dinner, or Snack.';
}
