import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LiveApp from './LiveApp.jsx';
import { accountRequest } from '../../services/accounts.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
beforeEach(() => {
  accountRequest.mockReset();
  window.location.hash = '/app/login';
});
const account = { id: 'avery', displayName: 'Avery Fiction', timeZone: 'America/Denver' };
const diary = {
  accountId: 'avery',
  date: '2026-11-09',
  timeZone: 'America/Denver',
  totals: { calories: 10 },
  meals: [],
};
it('shows sign-in after an expired session and retains the adult synthetic-data notice', async () => {
  accountRequest.mockRejectedValueOnce(Object.assign(new Error(), { status: 401 }));
  render(<LiveApp route="/app/login" />);
  expect(await screen.findByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
  expect(screen.getByText(/Adults 18\+/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Forgot password' })).toHaveAttribute(
    'href',
    '#/app/recover',
  );
});
it('loads the signed-in account diary then removes all private content on logout', async () => {
  accountRequest.mockImplementation((path) =>
    Promise.resolve(path === '/auth/session' ? { account } : path === '/dashboard' ? diary : null),
  );
  const user = userEvent.setup();
  render(<LiveApp route="/app/dashboard" />);
  expect(await screen.findByText('10 kcal')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
  expect(screen.queryByText('10 kcal')).not.toBeInTheDocument();
  expect(screen.queryByText(/Avery Fiction/)).not.toBeInTheDocument();
});
it('clears stale account data when any protected request reports session expiry', async () => {
  accountRequest.mockImplementation((path) =>
    Promise.resolve(path === '/auth/session' ? { account } : diary),
  );
  render(<LiveApp route="/app/dashboard" />);
  expect(await screen.findByText('10 kcal')).toBeVisible();
  await act(async () => window.dispatchEvent(new Event('nourishnet:expired')));
  expect(screen.queryByText('10 kcal')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Your session expired');
});
it('offers recovery when the local services are unavailable', async () => {
  accountRequest
    .mockRejectedValueOnce(new Error('network failed'))
    .mockRejectedValueOnce(Object.assign(new Error(), { status: 401 }));
  const user = userEvent.setup();
  render(<LiveApp route="/app/login" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Start the local API and database');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
});
it('signs into the account returned by the API after verification', async () => {
  accountRequest.mockImplementation((path) =>
    path === '/auth/session'
      ? Promise.reject(Object.assign(new Error(), { status: 401 }))
      : Promise.resolve(path === '/auth/login' ? { account } : diary),
  );
  const user = userEvent.setup();
  render(<LiveApp route="/app/login" />);
  await screen.findByRole('heading', { name: 'Sign in to NourishNet' });
  await user.type(screen.getByRole('textbox', { name: 'Fictional email' }), 'avery@example.test');
  await user.type(screen.getByLabelText('Password'), 'fictional-only-password');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('10 kcal')).toBeVisible();
  expect(window.location.hash).toBe('#/app/dashboard');
});
