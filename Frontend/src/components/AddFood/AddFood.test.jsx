import { act, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AddFood from './AddFood.jsx';

const food = {
  id: 'food',
  servingId: 'serving',
  name: 'Sample oats',
  servingBasis: '40 g dry oats',
  nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: null },
};

it('uses a contextual back label and invokes the owning scan flow', async () => {
  const user = userEvent.setup(),
    back = vi.fn();
  render(
    <AddFood
      food={food}
      draft={{ amount: '1', meal: 'Lunch' }}
      onDraftChange={vi.fn()}
      onBack={back}
      onSave={vi.fn()}
      backLabel="Back to barcode results"
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Back to barcode results' }));
  expect(back).toHaveBeenCalledOnce();
});
function Flow({ onSave, onBack = vi.fn() }) {
  const [draft, setDraft] = useState({ amount: '1', meal: '' });
  return (
    <AddFood food={food} draft={draft} onDraftChange={setDraft} onSave={onSave} onBack={onBack} />
  );
}
async function review(user) {
  await user.clear(screen.getByRole('textbox', { name: 'Serving amount' }));
  await user.type(screen.getByRole('textbox', { name: 'Serving amount' }), '1.5');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Lunch');
  await user.click(screen.getByRole('button', { name: 'Review entry' }));
}

it('validates serving and meal fields, confirms decimal nutrition, and preserves edits', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  render(<Flow onSave={save} />);
  const amount = screen.getByRole('textbox', { name: 'Serving amount' });
  for (const value of ['0', '-1', 'abc', '1e3', 'Infinity']) {
    await user.clear(amount);
    await user.type(amount, value);
    await user.click(screen.getByRole('button', { name: 'Review entry' }));
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/Enter a serving amount greater than zero/)).toBeVisible();
  }
  expect(screen.getByText('Choose Breakfast, Lunch, Dinner, or Snack.')).toBeVisible();
  await review(user);
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  expect(screen.getByText('1.5 servings × 40 g dry oats · Lunch')).toBeVisible();
  const nutrition = screen.getByRole('region', { name: 'Nutrition for selected amount' });
  for (const value of ['225 kcal', '7.5 g', '4.5 g', '40.5 g', 'Not provided'])
    expect(within(nutrition).getByText(value)).toBeVisible();
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Edit serving and meal' }));
  expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveValue('1.5');
  expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Lunch');
});

it('keeps a pending or completed confirmation one operation despite repeated taps', async () => {
  let resolve;
  const save = vi.fn(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const user = userEvent.setup();
  render(<Flow onSave={save} />);
  await review(user);
  await user.dblClick(screen.getByRole('button', { name: 'Save entry' }));
  expect(save).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Edit serving and meal' })).toBeDisabled();
  await act(async () => resolve());
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(save).toHaveBeenCalledOnce();
});

it('keeps confirmation on failure and retries the same operation without exposing diagnostics', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('private diagnostics'))
    .mockResolvedValueOnce();
  const user = userEvent.setup();
  render(<Flow onSave={save} />);
  await review(user);
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your choices are kept');
  expect(screen.queryByText('private diagnostics')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(save.mock.calls[0][0]).toBe(save.mock.calls[1][0]);
});

it('supports keyboard return to search and rejects quantities that overflow nutrition', async () => {
  const user = userEvent.setup(),
    back = vi.fn();
  render(<Flow onSave={vi.fn()} onBack={back} />);
  await user.type(screen.getByRole('textbox', { name: 'Serving amount' }), '0'.repeat(307));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Snack');
  await user.click(screen.getByRole('button', { name: 'Review entry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter a smaller serving amount');
  screen.getByRole('button', { name: 'Back to search' }).focus();
  await user.keyboard('{Enter}');
  expect(back).toHaveBeenCalledOnce();
});

it('explains the existing diary storage precision and range before saving', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  render(<Flow onSave={save} />);
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Lunch');
  for (const value of ['0.00001', '100000000']) {
    await user.clear(screen.getByRole('textbox', { name: 'Serving amount' }));
    await user.type(screen.getByRole('textbox', { name: 'Serving amount' }), value);
    await user.click(screen.getByRole('button', { name: 'Review entry' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at most four decimal places');
    expect(screen.queryByRole('button', { name: 'Save entry' })).not.toBeInTheDocument();
  }
  expect(save).not.toHaveBeenCalled();
  await review(user);
  expect(screen.getByRole('button', { name: 'Save entry' })).toBeVisible();
});
