import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import GoalSettings from './GoalSettings.jsx';
import { accountRequest } from '../../services/accounts.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
const account = { id: 'owner', timeZone: 'America/Denver' };
beforeEach(() => {
  accountRequest.mockReset();
});
it('loads a goal, validates optional macros, then requires review before one save', async () => {
  accountRequest.mockResolvedValue({ goal: null });
  const user = userEvent.setup();
  render(<GoalSettings account={account} />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading');
  await user.type(await screen.findByLabelText('Calorie target (kcal/day)'), '2000');
  await user.selectOptions(screen.getByLabelText('Macro goal units'), 'percent');
  await user.type(screen.getByLabelText('Protein goal (%)'), '30');
  await user.click(screen.getByRole('button', { name: 'Review goal' }));
  expect(screen.getByRole('alert')).toHaveTextContent('all three');
  await user.type(screen.getByLabelText('Carbohydrates goal (%)'), '50');
  await user.type(screen.getByLabelText('Fat goal (%)'), '20');
  await user.click(screen.getByRole('button', { name: 'Review goal' }));
  expect(screen.getByRole('region', { name: 'Review goal' })).toHaveTextContent(
    'not professional medical advice',
  );
  expect(accountRequest.mock.calls.filter(([p]) => p === '/personal/goals')).toHaveLength(0);
  await user.dblClick(screen.getByRole('button', { name: 'Save reviewed goal' }));
  await screen.findByText(/Goal saved/);
  expect(accountRequest.mock.calls.filter(([p]) => p === '/personal/goals')).toHaveLength(1);
  expect(accountRequest).toHaveBeenCalledWith(
    '/personal/goals',
    expect.objectContaining({
      body: expect.objectContaining({
        calories: 2000,
        macros: { protein: 30, carbohydrates: 50, fat: 20 },
        provenance: { kind: 'manual' },
      }),
    }),
  );
});
it('offers recovery without exposing stored goals while loading fails', async () => {
  accountRequest
    .mockRejectedValueOnce(new Error('private diagnostics'))
    .mockResolvedValue({ goal: null });
  const user = userEvent.setup();
  render(<GoalSettings account={account} />);
  await user.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByLabelText('Calorie target (kcal/day)')).toHaveValue('');
  expect(screen.queryByText('private diagnostics')).not.toBeInTheDocument();
});
it('calculates only chosen supported inputs, then lets the user decline or use a reference', async () => {
  accountRequest.mockResolvedValue({ goal: null });
  const user = userEvent.setup();
  render(<GoalSettings account={account} />);
  await screen.findByLabelText('Calorie target (kcal/day)');
  await user.click(screen.getByText('Calculate a reference calorie estimate'));
  await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
  expect(screen.getByRole('alert')).toHaveTextContent('skip the calculator');
  await user.selectOptions(screen.getByLabelText('Formula sex category'), 'male');
  await user.selectOptions(screen.getByLabelText('Habitual activity'), 'inactive');
  await user.type(screen.getByLabelText('Age (completed years)'), '30');
  await user.type(screen.getByLabelText('Height (cm)'), '180');
  await user.type(screen.getByLabelText('Weight (kg)'), '80');
  await user.click(screen.getByRole('checkbox', { name: /read the formula limits/ }));
  await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
  expect(screen.getByRole('region', { name: 'Reference estimate' })).toHaveTextContent(
    '2726 kcal/day',
  );
  expect(screen.getByLabelText('Calorie target (kcal/day)')).toHaveValue('');
  await user.click(screen.getByRole('button', { name: 'Use this reference as my draft target' }));
  expect(screen.getByLabelText('Calorie target (kcal/day)')).toHaveValue('2726');
  await user.clear(screen.getByLabelText('Age (completed years)'));
  await user.type(screen.getByLabelText('Age (completed years)'), '31');
  expect(screen.queryByRole('region', { name: 'Reference estimate' })).not.toBeInTheDocument();
});
it('keeps a failed save draft and retries with the same request key', async () => {
  let attempts = 0;
  accountRequest.mockImplementation(async (path) => {
    if (path === '/personal/goals' && ++attempts === 1) throw new Error();
    return { goal: null };
  });
  const user = userEvent.setup();
  render(<GoalSettings account={account} />);
  await user.type(await screen.findByLabelText('Calorie target (kcal/day)'), '2100');
  await user.click(screen.getByRole('button', { name: 'Review goal' }));
  await user.click(screen.getByRole('button', { name: 'Save reviewed goal' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('choices are kept');
  const key = accountRequest.mock.calls.find(([p]) => p === '/personal/goals')[1].body.requestKey;
  await user.click(screen.getByRole('button', { name: 'Save reviewed goal' }));
  await waitFor(() => expect(attempts).toBe(2));
  expect(
    accountRequest.mock.calls.filter(([p]) => p === '/personal/goals').at(-1)[1].body.requestKey,
  ).toBe(key);
});

it('converts existing macro values into a draft instead of losing them when units change', async () => {
  accountRequest.mockResolvedValue({
    goal: {
      id: 'goal',
      effectiveDate: '2000-01-01',
      calories: 2000,
      mode: 'maintain',
      macroMode: 'grams',
      macros: { protein: 150, carbohydrates: 250, fat: 44.4444 },
    },
  });
  const user = userEvent.setup();
  render(<GoalSettings account={account} />);
  await user.selectOptions(await screen.findByLabelText('Macro goal units'), 'percent');
  expect(screen.getByLabelText('Protein goal (%)')).toHaveValue('30.0000');
  expect(screen.getByLabelText('Carbohydrates goal (%)')).toHaveValue('50.0000');
  expect(screen.getByLabelText('Fat goal (%)')).toHaveValue('20.0000');
  expect(accountRequest.mock.calls.filter(([p]) => p === '/personal/goals')).toHaveLength(0);
});
