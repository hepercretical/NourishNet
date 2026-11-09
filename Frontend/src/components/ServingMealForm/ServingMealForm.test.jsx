import { act, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ServingMealForm from '../ServingMealForm/ServingMealForm.jsx';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function ServingHarness({ onSubmit, initial = { amount: '1.5', meal: 'Breakfast' } }) {
  const [draft, setDraft] = useState(initial);
  return (
    <ServingMealForm
      draft={draft}
      onDraftChange={setDraft}
      servingBasis="40 g dry"
      onSubmit={onSubmit}
    />
  );
}

it.each(['', '0', '-1', 'NaN', 'Infinity', '1e3', '1,5', '1.2.3', '   '])(
  'keeps invalid serving %j beside its field',
  async (amount) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ServingHarness onSubmit={onSubmit} initial={{ amount, meal: 'Lunch' }} />);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const input = screen.getByRole('textbox', { name: 'Serving amount' });
    expect(input).toHaveValue(amount);
    expect(input).toHaveAccessibleDescription(/greater than zero/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Lunch');
    expect(onSubmit).not.toHaveBeenCalled();
  },
);

it('focuses invalid fields, accepts decimal servings and every meal using native controls', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ServingHarness onSubmit={onSubmit} initial={{ amount: '', meal: '' }} />);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  const input = screen.getByRole('textbox', { name: 'Serving amount' });
  await vi.waitFor(() => expect(input).toHaveFocus());
  expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveAccessibleDescription(
    /Choose Breakfast/,
  );
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  await user.type(input, '.5');
  await user.tab();
  const meals = screen.getByRole('combobox', { name: 'Meal' });
  expect(meals).toHaveFocus();
  expect(
    within(meals)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual(['Choose a meal', 'Breakfast', 'Lunch', 'Dinner', 'Snack']);
  for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
    await user.selectOptions(meals, meal);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).toHaveBeenLastCalledWith({ amount: 0.5, meal });
  }
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('preserves decimal amount and meal after failure and submits once while pending', async () => {
  const user = userEvent.setup();
  const request = deferred();
  const onSubmit = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValueOnce(undefined);
  render(<ServingHarness onSubmit={onSubmit} />);
  await user.dblClick(screen.getByRole('button', { name: 'Continue' }));
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ amount: 1.5, meal: 'Breakfast' });
  expect(screen.getByRole('button', { name: 'Continuing…' })).toBeDisabled();
  expect(screen.getByRole('textbox', { name: 'Serving amount' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Meal' })).toBeDisabled();
  await act(async () => request.reject(new Error('private service diagnostic')));
  expect(screen.getByRole('alert')).toHaveTextContent(/choices are kept/);
  expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveValue('1.5');
  expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Breakfast');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(onSubmit).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
