import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import MealSelect from '../MealSelect/MealSelect.jsx';

it('keeps supplied validation for unsupported meals associated with the visible label', () => {
  render(<MealSelect value="" onChange={vi.fn()} error="Choose a supported meal." />);
  expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveAccessibleDescription(
    'Choose a supported meal.',
  );
});
