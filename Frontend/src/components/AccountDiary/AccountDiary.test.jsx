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
  render(<AccountDiary account={account} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.queryByText(/private diagnostics/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('0 kcal')).toBeVisible();
});
it('refuses diary data belonging to another account', async () => {
  accountRequest.mockResolvedValueOnce({ ...diary, accountId: 'morgan' });
  render(<AccountDiary account={account} />);
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
  const { rerender } = render(<AccountDiary key="avery" account={account} />);
  const signal = accountRequest.mock.calls.at(-1)[1].signal;
  rerender(<AccountDiary key="morgan" account={{ id: 'morgan', displayName: 'Morgan Fiction' }} />);
  expect(signal.aborted).toBe(true);
  expect(await screen.findByText('25 kcal')).toBeVisible();
  await act(async () => resolve(diary));
  expect(screen.queryByText('0 kcal')).not.toBeInTheDocument();
});
