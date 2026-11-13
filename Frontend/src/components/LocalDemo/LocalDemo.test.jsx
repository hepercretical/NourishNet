import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LocalDemo from './LocalDemo.jsx';

beforeEach(() => {
  window.history.replaceState({}, '', '/?demo=1#/app/dashboard');
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('nourishnet:diary-date:local-demo', '2026-11-09');
});
afterEach(() => {
  window.history.replaceState({}, '', '/');
  vi.unstubAllGlobals();
});

it('logs, reloads, edits and removes synthetic food without a login or API', async () => {
  const fetch = vi.fn(() => {
    throw new Error('Demo must not contact the API');
  });
  vi.stubGlobal('fetch', fetch);
  const user = userEvent.setup();
  const view = render(<LocalDemo route="/app/dashboard" />);
  expect(await screen.findByRole('region', { name: 'Recorded daily nutrition' })).toHaveTextContent(
    '0 kcal',
  );
  expect(screen.getByText(/No login or API required/)).toBeVisible();
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  view.rerender(<LocalDemo route="/app/search/Lunch" />);
  await user.type(screen.getByRole('searchbox'), 'oats{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Choose Sample rolled oats' }));
  const amount = screen.getByRole('textbox', { name: 'Serving amount' });
  await user.clear(amount);
  await user.type(amount, '1.5{Enter}');
  await user.dblClick(screen.getByRole('button', { name: 'Save entry' }));
  await screen.findByText(/Added Sample rolled oats/);
  view.rerender(<LocalDemo route="/app/dashboard" />);
  expect(await screen.findByRole('article', { name: 'Sample rolled oats' })).toBeVisible();
  expect(
    within(screen.getByRole('region', { name: 'Lunch' })).getAllByRole('article'),
  ).toHaveLength(1);
  view.unmount();
  render(<LocalDemo route="/app/dashboard" />);
  await user.click(await screen.findByRole('button', { name: 'Edit Sample rolled oats' }));
  const editAmount = screen.getByRole('textbox', { name: 'Serving amount' });
  await user.clear(editAmount);
  await user.type(editAmount, '2');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Dinner');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText(/updated. Reloading/);
  const dinner = await screen.findByRole('region', { name: 'Dinner' });
  expect(within(dinner).getByRole('article', { name: 'Sample rolled oats' })).toBeVisible();
  expect(
    within(screen.getByRole('region', { name: 'Recorded daily nutrition' })).getByText('300 kcal'),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Remove Sample rolled oats' }));
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }));
  await screen.findByText(/removed. Reloading/);
  expect(await screen.findByRole('region', { name: 'Recorded daily nutrition' })).toHaveTextContent(
    '0 kcal',
  );
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
