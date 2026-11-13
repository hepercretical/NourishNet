import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import WeightHistory from './WeightHistory.jsx';
import { accountRequest } from '../../services/accounts.js';
import { localToday } from '../../../../shared/personal.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
const account = { id: 'owner', timeZone: 'America/Denver' };
beforeEach(() => {
  accountRequest.mockReset();
});
it('starts empty, validates measurements and saves exactly one dated weight', async () => {
  accountRequest.mockResolvedValue({ weights: [], earliest: null });
  const user = userEvent.setup();
  render(<WeightHistory account={account} />);
  expect(await screen.findByText(/No weight measurements/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Save weight' }));
  expect(screen.getByRole('alert')).toHaveTextContent('positive weight');
  await user.type(screen.getByLabelText('Weight (kg)'), '72.5');
  await user.dblClick(screen.getByRole('button', { name: 'Save weight' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Weight history updated');
  expect(accountRequest.mock.calls.filter(([p]) => p === '/personal/weights')).toHaveLength(1);
  expect(accountRequest).toHaveBeenCalledWith(
    '/personal/weights',
    expect.objectContaining({
      body: expect.objectContaining({
        date: localToday(account.timeZone),
        weight: 72.5,
        unit: 'kg',
        currentVersion: null,
        removed: false,
      }),
    }),
  );
});
it('plots real points, supplies a table, converts units and confirms a historical removal', async () => {
  const today = localToday(account.timeZone);
  accountRequest.mockResolvedValue({
    weights: [{ id: 'measurement', date: today, kg: 72.5 }],
    earliest: today,
  });
  const user = userEvent.setup();
  render(<WeightHistory account={account} />);
  expect(await screen.findByRole('img', { name: /Recorded weights in kg/ })).toBeVisible();
  expect(screen.getByRole('table', { name: 'Recorded weight measurements' })).toHaveTextContent(
    '72.5000',
  );
  await user.selectOptions(screen.getByLabelText('Weight display unit'), 'lb');
  expect(screen.getByRole('table')).toHaveTextContent((72.5 / 0.45359237).toFixed(4));
  await user.click(screen.getByRole('button', { name: `Edit weight for ${today}` }));
  await user.click(screen.getByRole('checkbox', { name: /Remove this measurement/ }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  await waitFor(() =>
    expect(accountRequest).toHaveBeenCalledWith(
      '/personal/weights',
      expect.objectContaining({
        body: expect.objectContaining({ currentVersion: 'measurement', removed: true, unit: 'lb' }),
      }),
    ),
  );
});
it('shows a persistent retry after a failed load and supports interval selection', async () => {
  accountRequest
    .mockRejectedValueOnce(new Error())
    .mockResolvedValue({ weights: [], earliest: null });
  const user = userEvent.setup();
  render(<WeightHistory account={account} />);
  await user.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText(/No weight measurements/)).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Weight graph interval'), '7');
  await waitFor(() => expect(accountRequest.mock.calls.at(-1)[0]).toMatch(/weights\?from=/));
  expect(screen.getByLabelText('Weight graph interval')).toHaveValue('7');
});
