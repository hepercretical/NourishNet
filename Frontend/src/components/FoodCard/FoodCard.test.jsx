import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import FoodCard from '../FoodCard/FoodCard.jsx';

it('shows a serving basis, long food name, zero and missing values with a keyboard selection action', async () => {
  const user = userEvent.setup();
  const choose = vi.fn();
  const name = 'Rolled oats with toasted seeds and a very long package description';
  render(
    <FoodCard
      name={name}
      servingBasis="40 g dry"
      nutrients={{ calories: 150, protein: 5.5, fat: 0, carbohydrates: 27, sodium: null }}
      onSelect={choose}
    />,
  );
  expect(screen.getByRole('article', { name })).toBeVisible();
  expect(screen.getByText('Per serving: 40 g dry')).toBeVisible();
  expect(screen.getByText('0 g')).toBeVisible();
  expect(screen.getByText('5.5 g')).toBeVisible();
  expect(screen.getByText('Not provided')).toBeVisible();
  await user.tab();
  expect(screen.getByRole('button', { name: `Choose ${name}` })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(choose).toHaveBeenCalledTimes(1);
});

it('labels unreviewed food and prevents catalog selection', async () => {
  const choose = vi.fn();
  const user = userEvent.setup();
  render(<FoodCard name="Sample food" servingBasis="1 package" pendingReview onSelect={choose} />);
  expect(screen.getByRole('status')).toHaveTextContent(
    /Pending review.*not available as a reusable catalog food/,
  );
  await user.click(screen.getByRole('button', { name: 'Choose Sample food' }));
  expect(choose).not.toHaveBeenCalled();
  expect(screen.getAllByText('Not provided')).toHaveLength(5);
});

it('labels logged nutrition as the selected amount rather than per serving', () => {
  render(
    <FoodCard
      name="Sample oats"
      servingLabel="Logged amount"
      servingBasis="1.5 servings × 40 g"
      nutrients={{ calories: 225 }}
    />,
  );
  expect(screen.getByText('Logged amount: 1.5 servings × 40 g')).toBeVisible();
  expect(screen.getByText('225 kcal')).toBeVisible();
  expect(screen.queryByText(/Per serving:/)).not.toBeInTheDocument();
});
