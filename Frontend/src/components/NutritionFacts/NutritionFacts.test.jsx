import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import NutritionFacts from './NutritionFacts.jsx';
it('shows supplied precision and units while distinguishing zero from missing and invalid values', () => {
  render(
    <NutritionFacts
      values={{ calories: 150, protein: 5.5, fat: 0, carbohydrates: -1, sodium: Infinity }}
    />,
  );
  expect(screen.getByText('150 kcal')).toBeVisible();
  expect(screen.getByText('5.5 g')).toBeVisible();
  expect(screen.getByText('0 g')).toBeVisible();
  expect(screen.getAllByText('Not provided')).toHaveLength(2);
});
it('labels every missing nutrient without inventing values', () => {
  render(<NutritionFacts />);
  const terms = screen.getAllByRole('term');
  expect(terms.map((term) => term.textContent)).toEqual([
    'Calories',
    'Protein',
    'Fat',
    'Carbohydrates',
    'Sodium',
  ]);
  for (const term of terms)
    expect(within(term.parentElement).getByRole('definition')).toHaveTextContent('Not provided');
});
