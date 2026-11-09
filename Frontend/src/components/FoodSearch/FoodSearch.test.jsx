import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import FoodSearch from './FoodSearch.jsx';
import { searchFoods } from '../../services/foods.js';
vi.mock('../../services/foods.js', () => ({ searchFoods: vi.fn() }));
beforeEach(() => {
  searchFoods.mockReset();
});
const food = {
  id: 'food',
  servingId: 'serving',
  name: 'Synthetic rolled oats with a long product name',
  servingBasis: '40 g dry oats',
  nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: null },
};

it('starts empty, validates blank input and searches only on keyboard submission', async () => {
  searchFoods.mockResolvedValue([food]);
  const user = userEvent.setup();
  render(<FoodSearch />);
  expect(screen.getByText('Find your first food')).toBeVisible();
  await user.tab();
  expect(screen.getByRole('searchbox')).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByText('Enter a food name, such as rolled oats.')).toBeVisible();
  expect(searchFoods).not.toHaveBeenCalled();
  await user.type(screen.getByRole('searchbox'), 'oats');
  expect(searchFoods).not.toHaveBeenCalled();
  await user.keyboard('{Enter}');
  const card = await screen.findByRole('article', { name: food.name });
  for (const value of [
    'Per serving: 40 g dry oats',
    '150 kcal',
    '5 g',
    '3 g',
    '27 g',
    'Not provided',
  ])
    expect(within(card).getByText(value)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Back to diary' })).toHaveAttribute(
    'href',
    '#/app/dashboard',
  );
  expect(searchFoods).toHaveBeenCalledOnce();
});

it('keeps text and prevents repeat submission while a delayed search is pending', async () => {
  let resolve;
  searchFoods.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const user = userEvent.setup();
  render(<FoodSearch />);
  await user.type(screen.getByRole('searchbox'), 'oats{Enter}');
  expect(screen.getByRole('region', { name: 'Food search results' })).toHaveAttribute(
    'aria-busy',
    'true',
  );
  expect(screen.getByRole('searchbox')).toHaveValue('oats');
  expect(screen.getByRole('searchbox')).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Searching…' }));
  expect(searchFoods).toHaveBeenCalledOnce();
  await act(async () => resolve([]));
  expect(await screen.findByText('No foods found for “oats”')).toBeVisible();
  expect(screen.getByRole('searchbox')).toBeEnabled();
});

it('offers persistent safe error feedback and retries the submitted term with edited input preserved', async () => {
  searchFoods.mockRejectedValueOnce(new Error('private diagnostics')).mockResolvedValueOnce([food]);
  const user = userEvent.setup();
  render(<FoodSearch />);
  await user.type(screen.getByRole('searchbox'), 'oats{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Foods could not be loaded');
  expect(screen.queryByText('private diagnostics')).not.toBeInTheDocument();
  await user.type(screen.getByRole('searchbox'), ' new');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('article', { name: food.name })).toBeVisible();
  expect(searchFoods).toHaveBeenLastCalledWith('oats', expect.any(Object));
  expect(screen.getByRole('searchbox')).toHaveValue('oats new');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('explains overlong input without sending a request', async () => {
  const user = userEvent.setup();
  render(<FoodSearch />);
  await user.type(screen.getByRole('searchbox'), `${'a'.repeat(101)}{Enter}`);
  expect(await screen.findByRole('alert')).toHaveTextContent('100 search characters');
  expect(searchFoods).not.toHaveBeenCalled();
});
