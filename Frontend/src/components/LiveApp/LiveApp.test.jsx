import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LiveApp from './LiveApp.jsx';
import { accountRequest } from '../../services/accounts.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
beforeEach(() => {
  accountRequest.mockReset();
  sessionStorage.clear();
  sessionStorage.setItem('nourishnet:diary-date:avery', '2026-11-09');
  window.location.hash = '/app/login';
});
const account = { id: 'avery', displayName: 'Avery Fiction', timeZone: 'America/Denver' };
it('asks a verified new account to complete a profile before loading its diary', async () => {
  accountRequest.mockResolvedValueOnce({ account: null, needsProfile: true });
  render(<LiveApp route="/app/dashboard" />);
  expect(await screen.findByRole('heading', { name: 'Complete your account setup' })).toBeVisible();
  expect(screen.getByRole('checkbox', { name: 'I am 18 or older' })).not.toBeChecked();
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  expect(accountRequest).toHaveBeenCalledTimes(1);
});
const diary = {
  accountId: 'avery',
  date: '2026-11-09',
  timeZone: 'America/Denver',
  totals: { calories: 10 },
  meals: [],
};
it.each(['login', 'signup', 'verify', 'recover', 'reset'])(
  'keeps toolbar and five tabs on the %s account screen with a working skip link',
  async (mode) => {
    accountRequest.mockRejectedValueOnce(Object.assign(new Error(), { status: 401 }));
    const user = userEvent.setup();
    render(<LiveApp route={`/app/${mode}`} />);
    await screen.findByRole('form');
    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
    expect(
      within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('link'),
    ).toHaveLength(5);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    skip.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  },
);
it('shows sign-in after an expired session and retains the adult synthetic-data notice', async () => {
  accountRequest.mockRejectedValueOnce(Object.assign(new Error(), { status: 401 }));
  render(<LiveApp route="/app/login" />);
  expect(await screen.findByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
  expect(screen.getByText(/Adults 18\+/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Try without login' })).toHaveAttribute(
    'href',
    '?demo=1#/app/dashboard',
  );
  expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('link', { name: 'Forgot password' })).toHaveAttribute(
    'href',
    '#/app/recover',
  );
});
it('loads the signed-in account diary then removes all private content on logout', async () => {
  accountRequest.mockImplementation((path) =>
    Promise.resolve(
      path === '/auth/session' ? { account } : path.startsWith('/diary?') ? diary : null,
    ),
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

it('opens live search for a signed-in account and aborts a pending search on session expiry', async () => {
  let resolveSearch;
  accountRequest.mockImplementation((path) =>
    path === '/auth/session'
      ? Promise.resolve({ account })
      : new Promise((resolve) => {
          resolveSearch = resolve;
        }),
  );
  const user = userEvent.setup();
  render(<LiveApp route="/app/search" />);
  await screen.findByRole('searchbox');
  await user.type(screen.getByRole('searchbox'), 'sample{Enter}');
  expect(accountRequest).toHaveBeenCalledTimes(2);
  const [path, options] = accountRequest.mock.calls[1];
  expect(path).toBe('/foods?q=sample');
  expect(options.signal.aborted).toBe(false);
  await act(async () => window.dispatchEvent(new Event('nourishnet:expired')));
  expect(options.signal.aborted).toBe(true);
  await act(async () => resolveSearch({ foods: [{ servingId: 'old', name: 'Old account food' }] }));
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(screen.queryByText('Old account food')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
});

it('requires a session before showing live search', async () => {
  accountRequest.mockRejectedValueOnce(Object.assign(new Error(), { status: 401 }));
  render(<LiveApp route="/app/search" />);
  expect(await screen.findByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(accountRequest).toHaveBeenCalledOnce();
});

it.each(['logout', 'expiry'])(
  'adds one visible decimal entry, returns to the tracker, and hides it until signing back in after %s',
  async (exit) => {
    const food = {
      id: 'food',
      servingId: 'serving',
      name: 'Sample oats',
      servingBasis: '40 g dry oats',
      nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: null },
    };
    const currentDiary = {
      ...diary,
      date: new Intl.DateTimeFormat('en-CA', {
        timeZone: account.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
      meals: ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((name) => ({ name, entries: [] })),
    };
    sessionStorage.setItem('nourishnet:diary-date:avery', currentDiary.date);
    accountRequest.mockImplementation((path, options) => {
      if (path === '/diary') {
        currentDiary.meals[1].entries = [
          {
            id: 'persisted',
            foodName: food.name,
            quantity: options.body.quantity,
            servingBasis: food.servingBasis,
            contribution: { calories: 225 },
          },
        ];
        currentDiary.totals = { calories: 225 };
      }
      return Promise.resolve(
        path === '/auth/session' || path === '/auth/login'
          ? { account }
          : path.startsWith('/foods?')
            ? { foods: [food] }
            : currentDiary,
      );
    });
    const user = userEvent.setup();
    const { rerender } = render(<LiveApp route="/app/search/Lunch" />);
    await user.type(await screen.findByRole('searchbox'), 'sample{Enter}');
    const choose = await screen.findByRole('button', { name: 'Choose Sample oats' });
    choose.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Lunch');
    await user.clear(screen.getByRole('textbox', { name: 'Serving amount' }));
    await user.type(screen.getByRole('textbox', { name: 'Serving amount' }), '1.5{Enter}');
    await user.dblClick(screen.getByRole('button', { name: 'Save entry' }));
    expect(window.location.hash).toBe('#/app/dashboard');
    rerender(<LiveApp route="/app/dashboard" />);
    const lunch = await screen.findByRole('region', { name: 'Lunch' });
    expect(within(lunch).getAllByRole('article', { name: 'Sample oats' })).toHaveLength(1);
    expect(within(lunch).getByText('Logged amount: 1.5 servings × 40 g dry oats')).toBeVisible();
    expect(within(lunch).getByText('225 kcal')).toBeVisible();
    expect(within(lunch).queryByText(/No food recorded/)).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Breakfast' })).queryByRole('article'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added Sample oats to lunch');
    if (exit === 'logout') await user.click(screen.getByRole('button', { name: 'Sign out' }));
    else await act(async () => window.dispatchEvent(new Event('nourishnet:expired')));
    expect(screen.queryByRole('article', { name: 'Sample oats' })).not.toBeInTheDocument();
    rerender(<LiveApp route="/app/login" />);
    await user.type(screen.getByRole('textbox', { name: 'Fictional email' }), 'avery@example.test');
    await user.type(screen.getByLabelText('Password'), 'fictional-only-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    rerender(<LiveApp route="/app/dashboard" />);
    await screen.findByRole('region', { name: 'Lunch' });
    expect(screen.getByRole('article', { name: 'Sample oats' })).toBeVisible();
  },
);
