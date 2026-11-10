import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AccountDiary from './AccountDiary.jsx';
import { accountRequest } from '../../services/accounts.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
const account = { id: 'avery', displayName: 'Avery Fiction' };
const diary = {
  accountId: 'avery',
  date: '2026-11-09',
  timeZone: 'America/Denver',
  totals: { calories: 0 },
  meals: [],
};
it('loads only the matching owner diary and supports a failed-load retry', async () => {
  accountRequest
    .mockRejectedValueOnce(new Error('private diagnostics'))
    .mockResolvedValueOnce(diary);
  const user = userEvent.setup();
  render(<AccountDiary account={account} date={diary.date} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.queryByText(/private diagnostics/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('0 kcal')).toBeVisible();
});
it('refuses a response for a different diary date', async () => {
  accountRequest.mockResolvedValueOnce({ ...diary, date: '2026-11-08' });
  render(<AccountDiary account={account} date={diary.date} />);
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.queryByText('0 kcal')).not.toBeInTheDocument();
});

it('cancels an old account request and ignores its late response after switching owners', async () => {
  let resolve;
  accountRequest
    .mockImplementationOnce(
      () =>
        new Promise((yes) => {
          resolve = yes;
        }),
    )
    .mockResolvedValueOnce({ ...diary, accountId: 'morgan', totals: { calories: 25 } });
  const { rerender } = render(<AccountDiary key="avery" account={account} date={diary.date} />);
  const signal = accountRequest.mock.calls.at(-1)[1].signal;
  rerender(
    <AccountDiary
      key="morgan"
      account={{ id: 'morgan', displayName: 'Morgan Fiction' }}
      date={diary.date}
    />,
  );
  expect(signal.aborted).toBe(true);
  expect(await screen.findByText('25 kcal')).toBeVisible();
  await act(async () => resolve(diary));
  expect(screen.queryByText('0 kcal')).not.toBeInTheDocument();
});

const savedEntry = {
  id: '20000000-0000-4000-8000-000000000001',
  revision: 1,
  foodName: 'Sample oats',
  quantity: 1,
  meal: 'breakfast',
  servingBasis: '40 g',
  nutrients: { calories: 150, protein: 5, fat: 0, carbohydrates: 27, sodium: null },
  contribution: { calories: 150, protein: 5, fat: 0, carbohydrates: 27, sodium: null },
};
function recorded(entries = [savedEntry], calories = 150) {
  return {
    ...diary,
    totals: { calories },
    meals: ['breakfast', 'lunch', 'dinner', 'snack'].map((name) => ({
      name,
      entries: entries.filter((entry) => entry.meal === name),
    })),
  };
}
it('updates meal lists and authoritative totals after an edit, then removes with confirmation', async () => {
  const user = userEvent.setup();
  accountRequest
    .mockResolvedValueOnce(recorded())
    .mockResolvedValueOnce({ entry: { ...savedEntry, revision: 2 } })
    .mockResolvedValueOnce(
      recorded(
        [
          {
            ...savedEntry,
            revision: 2,
            quantity: 0.5,
            meal: 'lunch',
            contribution: { calories: 75 },
          },
        ],
        75,
      ),
    )
    .mockResolvedValueOnce({ removedId: savedEntry.id })
    .mockResolvedValueOnce(recorded([], 0));
  render(<AccountDiary account={account} date={diary.date} />);
  await user.click(await screen.findByRole('button', { name: 'Edit Sample oats' }));
  const amount = screen.getByRole('textbox', { name: 'Serving amount' });
  await user.clear(amount);
  await user.type(amount, '0.5');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Lunch');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(
    await screen.findByText(
      'No food recorded for breakfast. Find a food when you are ready to start this meal.',
    ),
  ).toBeVisible();
  expect(screen.getAllByText('75 kcal')).toHaveLength(2);
  expect(screen.getByRole('heading', { name: 'Your daily diary' })).toHaveFocus();
  expect(accountRequest).toHaveBeenCalledWith(
    `/diary/entries/${savedEntry.id}`,
    expect.objectContaining({
      method: 'PATCH',
      body: expect.objectContaining({
        date: diary.date,
        revision: 1,
        quantity: 0.5,
        meal: 'lunch',
        requestKey: expect.any(String),
      }),
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Remove Sample oats' }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(await screen.findByText('0 kcal')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Remove Sample oats' })).not.toBeInTheDocument();
  expect(accountRequest).toHaveBeenCalledWith(
    `/diary/entries/${savedEntry.id}`,
    expect.objectContaining({ method: 'DELETE', body: expect.objectContaining({ revision: 2 }) }),
  );
});
it('keeps a successful removal distinct from a failed totals reload and retries the read only', async () => {
  const user = userEvent.setup();
  accountRequest
    .mockResolvedValueOnce(recorded())
    .mockResolvedValueOnce({ removedId: savedEntry.id })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(recorded([], 0));
  render(<AccountDiary account={account} date={diary.date} />);
  await user.click(await screen.findByRole('button', { name: 'Remove Sample oats' }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.getByRole('status')).toHaveTextContent('removed');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('0 kcal')).toBeVisible();
  expect(
    accountRequest.mock.calls.filter(([, options]) => options.method === 'DELETE'),
  ).toHaveLength(1);
});
it('aborts an in-flight entry change when leaving the selected owner/day', async () => {
  const user = userEvent.setup();
  let finish;
  accountRequest.mockResolvedValueOnce(recorded()).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { unmount } = render(<AccountDiary account={account} date={diary.date} />);
  await user.click(await screen.findByRole('button', { name: 'Remove Sample oats' }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  const signal = accountRequest.mock.calls.at(-1)[1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => finish({ removedId: savedEntry.id }));
  expect(accountRequest).toHaveBeenCalledTimes(2);
});
