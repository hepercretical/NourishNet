import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import Stats from './Stats.jsx';
import { accountRequest } from '../../services/accounts.js';
import { localToday } from '../../../../shared/personal.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
const account = { id: 'owner', timeZone: 'America/Denver' };
beforeEach(() => {
  accountRequest.mockReset();
});
it('shows exact calendar shades, neutral missing days, streaks and working day selection', async () => {
  const selected = vi.fn(),
    user = userEvent.setup();
  accountRequest.mockImplementation(async (path) =>
    path.includes('/weights')
      ? { weights: [], earliest: null }
      : {
          days: [
            { date: '2026-01-02', count: 1, calories: 1900 },
            { date: '2026-01-03', count: 1, calories: 2101 },
          ],
          goals: [{ effectiveDate: '2026-01-01', mode: 'deficit', calories: 2000 }],
          streaks: { current: 0, longest: 1, ending: null },
        },
  );
  render(<Stats account={account} date="2026-01-02" onSelectDate={selected} />);
  const met = await screen.findByRole('button', {
    name: '2026-01-02: Goal met · 100 kcal from target',
  });
  expect(met).toHaveClass('calendar-day--met-regular');
  expect(
    screen.getByRole('button', { name: '2026-01-03: Outside goal · 101 kcal from target' }),
  ).toHaveClass('calendar-day--outside-dark');
  expect(screen.getByRole('button', { name: '2026-01-04: No food logged' })).toHaveClass(
    'calendar-day--unlogged',
  );
  met.focus();
  await user.keyboard('{Enter}');
  expect(selected).toHaveBeenCalledWith('2026-01-02');
  expect(screen.getByText('1 days')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Next month' }));
  expect(await screen.findByRole('heading', { name: 'February 2026' })).toBeVisible();
});
it('keeps calendar errors recoverable without a fabricated outcome', async () => {
  accountRequest.mockImplementation(async (path) => {
    if (path.includes('/stats')) throw new Error();
    return { weights: [], earliest: null };
  });
  render(<Stats account={account} date={localToday(account.timeZone)} onSelectDate={vi.fn()} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Calendar could not be loaded');
  expect(screen.queryByRole('button', { name: /Goal met/ })).not.toBeInTheDocument();
});
