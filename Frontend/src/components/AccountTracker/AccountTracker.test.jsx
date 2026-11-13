import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import AccountTracker from './AccountTracker.jsx';
import { accountRequest } from '../../services/accounts.js';

vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
const account = { id: 'avery', displayName: 'Avery Fiction', timeZone: 'America/Denver' };
const food = {
  id: 'food',
  servingId: 'serving',
  name: 'Sample oats',
  servingBasis: '40 g',
  nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: null },
};
const day = (date, entries = []) => ({
  date,
  timeZone: account.timeZone,
  totals: {
    calories: entries.length ? 225 : 0,
    protein: 7.5,
    fat: 4.5,
    carbohydrates: 40.5,
    sodium: entries.length ? null : 0,
  },
  meals: ['breakfast', 'lunch', 'dinner', 'snack'].map((name) => ({
    name,
    entries: name === 'lunch' ? entries : [],
  })),
});
const savedEntry = {
  id: 'saved',
  foodName: food.name,
  servingBasis: food.servingBasis,
  quantity: 1.5,
  nutrients: food.nutrients,
  contribution: { calories: 225, protein: 7.5, fat: 4.5, carbohydrates: 40.5, sodium: null },
};

it('keeps an unknown-product photo draft on back navigation, then submits to the real API client', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:test-photo');
  URL.revokeObjectURL = vi.fn();
  const user = userEvent.setup(),
    notice = vi.fn();
  accountRequest.mockImplementation((path) =>
    path.startsWith('/foods/barcode')
      ? Promise.resolve({
          status: 'unknown',
          barcode: { input: '030000010402', gtin14: '00030000010402' },
          foods: [],
        })
      : Promise.resolve({ submission: { id: 'record', status: 'pending' } }),
  );
  const props = { account, onNotice: notice };
  const view = render(<AccountTracker {...props} route="/app/scan/Lunch" />);
  await user.type(screen.getByLabelText('Barcode number'), '030000010402{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Submit package and label photos' }));
  expect(window.location.hash).toBe('#/app/submissions/new');
  view.rerender(<AccountTracker {...props} route="/app/submissions/new" />);
  await user.type(screen.getByLabelText('Product name (optional)'), 'Quaker oats 42 oz');
  await user.upload(
    screen.getByLabelText('Choose package front photo'),
    new File(['front'], 'front.jpg', { type: 'image/jpeg' }),
  );
  await user.click(screen.getByRole('button', { name: 'Back to scan' }));
  view.rerender(<AccountTracker {...props} route="/app/scan" />);
  view.rerender(<AccountTracker {...props} route="/app/submissions/new" />);
  expect(screen.getByLabelText('Product name (optional)')).toHaveValue('Quaker oats 42 oz');
  expect(screen.getByAltText('Package front photo preview')).toBeVisible();
  await user.upload(
    screen.getByLabelText('Choose nutrition label photo'),
    new File(['label'], 'label.png', { type: 'image/png' }),
  );
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  await waitFor(() => expect(window.location.hash).toBe('#/app/submissions/record'));
  expect(accountRequest).toHaveBeenCalledWith(
    '/submissions',
    expect.objectContaining({
      body: expect.objectContaining({
        barcode: '030000010402',
        productName: 'Quaker oats 42 oz',
        requestKey: expect.any(String),
      }),
    }),
  );
  expect(notice).toHaveBeenCalledWith(expect.stringContaining('submitted for review'));
});

it('preserves the selected local date and meal from barcode confirmation into a real diary save', async () => {
  const user = userEvent.setup(),
    notice = vi.fn();
  accountRequest.mockImplementation((path) =>
    path.startsWith('/foods/barcode')
      ? Promise.resolve({
          status: 'found',
          barcode: { input: '030000010204', gtin14: '00030000010204' },
          foods: [food],
        })
      : Promise.resolve({}),
  );
  render(<AccountTracker account={account} route="/app/scan/Lunch" onNotice={notice} />);
  expect(screen.getByText(/Adding food for 2026-11-09/)).toBeVisible();
  await user.type(screen.getByLabelText('Barcode number'), '030000010204{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Review entry' }));
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(accountRequest).toHaveBeenCalledWith(
    '/diary',
    expect.objectContaining({
      body: expect.objectContaining({
        date: '2026-11-09',
        meal: 'lunch',
        servingId: 'serving',
        quantity: 1,
      }),
    }),
  );
  expect(window.location.hash).toBe('#/app/dashboard');
});
it('moves through local diary dates using previous and next controls and preserves the selected day', async () => {
  const user = userEvent.setup();
  accountRequest.mockImplementation((path) => Promise.resolve(day(path.split('=')[1])));
  render(<AccountTracker account={account} route="/app/dashboard" onNotice={vi.fn()} />);
  await screen.findByText('0 kcal');
  await user.click(screen.getByRole('button', { name: 'Previous diary day' }));
  expect(screen.getByLabelText('Diary date')).toHaveValue('2026-11-08');
  await screen.findByText('0 kcal');
  expect(accountRequest.mock.calls.filter(([path]) => path.startsWith('/diary?')).at(-1)[0]).toBe(
    '/diary?date=2026-11-08',
  );
  await user.click(screen.getByRole('button', { name: 'Next diary day' }));
  await screen.findByText('0 kcal');
  expect(screen.getByLabelText('Diary date')).toHaveValue('2026-11-09');
  expect(sessionStorage.getItem('nourishnet:diary-date:avery')).toBe('2026-11-09');
});
beforeEach(() => {
  accountRequest.mockReset();
  sessionStorage.clear();
  sessionStorage.setItem('nourishnet:diary-date:avery', '2026-11-09');
  window.location.hash = '/app/search/Lunch';
});
async function confirm(user) {
  await user.type(await screen.findByRole('searchbox'), 'sample{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Choose Sample oats' }));
  await user.clear(screen.getByRole('textbox', { name: 'Serving amount' }));
  await user.type(screen.getByRole('textbox', { name: 'Serving amount' }), '1.5{Enter}');
}
it('reloads a selected day after remount, hides stale results during date changes and ignores late replies', async () => {
  let resolveOld;
  accountRequest.mockImplementation((path) =>
    path.endsWith('2026-11-08')
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve(day(path.split('=')[1], path.endsWith('2026-11-09') ? [savedEntry] : [])),
  );
  const notice = vi.fn();
  let view = render(<AccountTracker account={account} route="/app/dashboard" onNotice={notice} />);
  expect(await screen.findByRole('article', { name: food.name })).toBeVisible();
  fireEvent.change(screen.getByLabelText('Diary date'), { target: { value: '2026-11-08' } });
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Loading your diary');
  const signal = accountRequest.mock.calls.find(([path]) => path === '/diary?date=2026-11-08')[1]
    .signal;
  fireEvent.change(screen.getByLabelText('Diary date'), { target: { value: '2026-11-07' } });
  expect(signal.aborted).toBe(true);
  await screen.findByText('0 kcal');
  await act(async () => resolveOld(day('2026-11-08', [savedEntry])));
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.getAllByText(/No food recorded/)).toHaveLength(4);
  view.unmount();
  view = render(<AccountTracker account={account} route="/app/dashboard" onNotice={notice} />);
  expect(screen.getByLabelText('Diary date')).toHaveValue('2026-11-07');
  await screen.findByText('0 kcal');
  expect(accountRequest.mock.calls.filter(([path]) => path.startsWith('/diary?')).at(-1)[0]).toBe(
    '/diary?date=2026-11-07',
  );
  view.unmount();
});
it('keeps a failed save and its retry key, prevents duplicate taps and reloads authoritative contributions and totals', async () => {
  const user = userEvent.setup(),
    notice = vi.fn();
  let resolveSave;
  let attempts = 0;
  accountRequest.mockImplementation((path) => {
    if (path.startsWith('/foods')) return Promise.resolve({ foods: [food] });
    if (path === '/diary') {
      if (++attempts === 1) return Promise.reject(new Error('private diagnostics'));
      return new Promise((resolve) => {
        resolveSave = resolve;
      });
    }
    return Promise.resolve(day('2026-11-09', [savedEntry]));
  });
  const { rerender, unmount } = render(
    <AccountTracker account={account} route="/app/search/Lunch" onNotice={notice} />,
  );
  await confirm(user);
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your choices are kept');
  expect(screen.queryByText('private diagnostics')).not.toBeInTheDocument();
  const first = accountRequest.mock.calls.find(([path]) => path === '/diary')[1].body;
  expect(first).toEqual({
    date: '2026-11-09',
    quantity: 1.5,
    meal: 'lunch',
    servingId: 'serving',
    requestKey: expect.any(String),
  });
  await user.dblClick(screen.getByRole('button', { name: 'Try again' }));
  expect(attempts).toBe(2);
  expect(accountRequest.mock.calls.at(-1)[1].body).toEqual(first);
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(notice).not.toHaveBeenCalled();
  await act(async () => resolveSave({ date: first.date, entry: savedEntry }));
  expect(notice).toHaveBeenCalledWith('Added Sample oats to lunch for 2026-11-09.');
  expect(window.location.hash).toBe('#/app/dashboard');
  rerender(<AccountTracker account={account} route="/app/dashboard" onNotice={notice} />);
  const lunch = await screen.findByRole('region', { name: 'Lunch' });
  expect(within(lunch).getAllByRole('article')).toHaveLength(1);
  expect(within(lunch).getByText('Logged amount: 1.5 servings × 40 g')).toBeVisible();
  expect(within(lunch).getByText('225 kcal')).toBeVisible();
  const summary = screen.getByRole('region', { name: 'Recorded daily nutrition' });
  expect(within(summary).getByText('225 kcal')).toBeVisible();
  expect(within(summary).getByText('Not provided')).toBeVisible();
  unmount();
  render(<AccountTracker account={account} route="/app/dashboard" onNotice={notice} />);
  expect(await screen.findByRole('article', { name: food.name })).toBeVisible();
});
it('cancels a pending save on leaving the account and ignores a late successful reply', async () => {
  let resolve;
  accountRequest.mockImplementation((path) =>
    path.startsWith('/foods')
      ? Promise.resolve({ foods: [food] })
      : new Promise((done) => {
          resolve = done;
        }),
  );
  const notice = vi.fn(),
    user = userEvent.setup();
  const { unmount } = render(
    <AccountTracker account={account} route="/app/search/Lunch" onNotice={notice} />,
  );
  await confirm(user);
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  const signal = accountRequest.mock.calls.at(-1)[1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ entry: savedEntry }));
  expect(notice).not.toHaveBeenCalled();
  expect(window.location.hash).toBe('#/app/search/Lunch');
});
it('starts another account on its own local day and ignores a malformed stored date', async () => {
  sessionStorage.setItem('nourishnet:diary-date:morgan', '2026-99-99');
  accountRequest.mockImplementation((path) => Promise.resolve(day(path.split('=')[1])));
  const other = {
    ...account,
    id: 'morgan',
    displayName: 'Morgan Fiction',
    timeZone: 'Pacific/Kiritimati',
  };
  render(<AccountTracker account={other} route="/app/dashboard" onNotice={vi.fn()} />);
  const expected = new Intl.DateTimeFormat('en-CA', {
    timeZone: other.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  expect(screen.getByLabelText('Diary date')).toHaveValue(expected);
  await screen.findByText('0 kcal');
  expect(accountRequest.mock.calls.filter(([path]) => path.startsWith('/diary?')).at(-1)[0]).toBe(
    `/diary?date=${expected}`,
  );
});

it('keeps the previous day and explains an invalid date without requesting an invalid diary', async () => {
  const user = userEvent.setup();
  accountRequest.mockResolvedValue(day('2026-11-09'));
  render(<AccountTracker account={account} route="/app/dashboard" onNotice={vi.fn()} />);
  await screen.findByText('0 kcal');
  const input = screen.getByLabelText('Diary date');
  await user.clear(input);
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a real diary date');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveValue('2026-11-09');
  expect(accountRequest.mock.calls.filter(([path]) => path.startsWith('/diary?'))).toHaveLength(1);
});
