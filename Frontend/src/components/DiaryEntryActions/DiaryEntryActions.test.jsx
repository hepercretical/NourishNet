import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import DiaryEntryActions from './DiaryEntryActions.jsx';
const entry = {
  id: 'entry',
  foodName: 'Sample oats',
  quantity: 1.5,
  meal: 'breakfast',
  servingBasis: '40 g dry',
  nutrients: { calories: 150, protein: 5, fat: 0, carbohydrates: 27, sodium: null },
};
it('validates input, previews scaled nutrition and saves a different meal with keyboard controls', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn().mockResolvedValue();
  render(<DiaryEntryActions entry={entry} onChange={onChange} />);
  screen.getByRole('button', { name: 'Edit Sample oats' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: 'Edit Sample oats' })).toHaveFocus();
  const amount = screen.getByRole('textbox', { name: 'Serving amount' });
  for (const value of ['0', '-1', '1.00001', '100000000', 'abc']) {
    await user.clear(amount);
    await user.type(amount, value);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(amount).toHaveAttribute('aria-invalid', 'true');
  }
  expect(onChange).not.toHaveBeenCalled();
  await user.clear(amount);
  await user.type(amount, '0.25');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Lunch');
  expect(screen.getByText('37.5 kcal')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(onChange).toHaveBeenCalledWith(
    entry,
    'edit',
    { quantity: 0.25, meal: 'lunch' },
    expect.any(String),
  );
});
it('cancels edits and removal without writing and restores focus', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<DiaryEntryActions entry={entry} onChange={onChange} />);
  for (const action of ['Edit', 'Remove']) {
    await user.click(screen.getByRole('button', { name: `${action} Sample oats` }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: `${action} Sample oats` })).toHaveFocus();
  }
  expect(onChange).not.toHaveBeenCalled();
});
it('requires explicit removal confirmation and blocks repeated clicks while pending', async () => {
  let finish;
  const user = userEvent.setup();
  const onChange = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<DiaryEntryActions entry={entry} onChange={onChange} />);
  await user.click(screen.getByRole('button', { name: 'Remove Sample oats' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByText(/Remove 1.5 servings/)).toBeVisible();
  await user.dblClick(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(onChange).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await act(async () => finish());
});
it('preserves failed edits, retries the same key and hides private errors', async () => {
  const user = userEvent.setup();
  const onChange = vi
    .fn()
    .mockRejectedValueOnce(new Error('private diagnostic'))
    .mockResolvedValue();
  render(<DiaryEntryActions entry={entry} onChange={onChange} />);
  await user.click(screen.getByRole('button', { name: 'Edit Sample oats' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Snack');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('choices are kept');
  expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Snack');
  expect(screen.queryByText(/private diagnostic/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(onChange.mock.calls[1]).toEqual(onChange.mock.calls[0]);
});
it.each([404, 409])('requires review after a stale or unavailable entry (%s)', async (status) => {
  const user = userEvent.setup();
  const onChange = vi.fn().mockRejectedValue({ status });
  render(<DiaryEntryActions entry={entry} onChange={onChange} />);
  await user.click(screen.getByRole('button', { name: 'Remove Sample oats' }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(screen.getByRole('alert')).toHaveTextContent('reload');
  expect(
    within(screen.getByRole('region', { name: 'Remove diary entry' })).getByRole('button', {
      name: 'Confirm removal',
    }),
  ).toBeDisabled();
});

it('blocks repeated edit submissions and preserves failed removal for an identical retry', async () => {
  let finish;
  const user = userEvent.setup();
  const edit = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const view = render(<DiaryEntryActions entry={entry} onChange={edit} />);
  await user.click(screen.getByRole('button', { name: 'Edit Sample oats' }));
  await user.dblClick(screen.getByRole('button', { name: 'Save changes' }));
  expect(edit).toHaveBeenCalledOnce();
  expect(screen.getByRole('textbox', { name: 'Serving amount' })).toBeDisabled();
  await act(async () => finish());
  view.unmount();
  const remove = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue();
  render(<DiaryEntryActions entry={entry} onChange={remove} />);
  await user.click(screen.getByRole('button', { name: 'Remove Sample oats' }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(screen.getByRole('alert')).toHaveTextContent('could not be confirmed');
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(remove.mock.calls[1]).toEqual(remove.mock.calls[0]);
});
