import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DevelopmentSetup from './pages/DevelopmentSetup.jsx';
import App from './App.jsx';

afterEach(() => vi.unstubAllGlobals());

it('navigates the real five-tab app, preserves the summary day and saves a private appearance choice', async () => {
  const account = {
    id: 'design-owner',
    displayName: 'Private test account',
    timeZone: 'America/Denver',
  };
  const date = '2026-11-12';
  sessionStorage.setItem('nourishnet:diary-date:design-owner', date);
  let appearance = { mode: 'light', accent: 'green', revision: 0 };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path, options) => {
      let data;
      if (path === '/api/auth/session') data = { account };
      else if (path.startsWith('/api/diary?'))
        data = {
          date,
          timeZone: account.timeZone,
          totals: { calories: 150, protein: 5, carbohydrates: 27, fat: 3, sodium: 0 },
          goal: { calories: 2000, mode: 'maintain' },
          meals: [],
        };
      else if (path.startsWith('/api/personal/stats?'))
        data = { days: [], goals: [], streaks: { current: 0, longest: 0, ending: null } };
      else if (path.startsWith('/api/personal/weights?')) data = { weights: [], earliest: null };
      else if (path === '/api/personal/appearance') {
        if (options.method === 'PUT') {
          const body = JSON.parse(options.body);
          appearance = { mode: body.mode, accent: body.accent, revision: 1 };
        }
        data = appearance;
      } else throw new Error('Unexpected mock path');
      return { ok: true, json: async () => data };
    }),
  );
  window.history.replaceState({}, '', '/#/app/dashboard');
  const user = userEvent.setup();
  const view = render(<App />);
  try {
    expect(await screen.findByText('1850 kcal remaining to target')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'View daily summary' }));
    expect(await screen.findByRole('heading', { name: 'Daily summary' })).toBeVisible();
    expect(screen.getByText(/2026-11-12 · America\/Denver/)).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Stats', exact: true }));
    expect(await screen.findByRole('heading', { name: 'Food logging calendar' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Track', exact: true }));
    expect(await screen.findByRole('heading', { name: 'Track food' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Connections', exact: true }));
    expect(await screen.findByText('Coming Soon...')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Preferences', exact: true }));
    await user.click(await screen.findByRole('link', { name: 'Appearance' }));
    await screen.findByLabelText('Theme');
    expect(document.title).toBe('NourishNet | Appearance');
    await user.selectOptions(screen.getByLabelText('Theme'), 'dark');
    await user.selectOptions(screen.getByLabelText('Main color'), 'blue');
    await user.click(screen.getByRole('button', { name: 'Save appearance' }));
    expect(await screen.findByText('Appearance saved.')).toBeVisible();
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(document.documentElement.dataset.accent).toBe('blue');
  } finally {
    view.unmount();
    window.history.replaceState({}, '', '/');
  }
  expect(document.documentElement.dataset.mode).toBeUndefined();
});

it('opens the actual account flow at the root and ignores the retired demo query switch', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
  vi.stubGlobal('fetch', fetch);
  window.history.replaceState({}, '', '/?demo=1');
  localStorage.clear();
  try {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Sign in to NourishNet' })).toBeVisible();
    expect(screen.getByLabelText('Password')).toBeVisible();
    expect(screen.queryByText(/Sample rolled oats|Sample diary/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Try without login' })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/auth/session', expect.any(Object));
  } finally {
    window.history.replaceState({}, '', '/');
  }
});

it.each([
  '/design',
  '/design/components',
  '/development',
  '/scan',
  '/goals',
  '/privacy',
  '/terms',
  '/app/unknown',
  '/app/submissions/invalid',
])('does not expose retired or unimplemented route %s', (route) => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  window.history.replaceState({}, '', `/#${route}`);
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Open your diary' })).toHaveAttribute(
    'href',
    '#/app/dashboard',
  );
  expect(screen.queryByText(/preview|planned|coming soon/i)).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  window.history.replaceState({}, '', '/');
});

describe('development setup', () => {
  it('explains the internal setup before making a connection check', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<DevelopmentSetup />);

    expect(screen.getByRole('heading', { level: 1, name: 'NourishNet' })).toBeVisible();
    expect(screen.getByText(/open the food diary demo without signing in/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open local demo' })).toHaveAttribute(
      'href',
      '?demo=1#/app/dashboard',
    );
    expect(screen.getByRole('status')).toHaveTextContent('No connection check yet');
    expect(request).not.toHaveBeenCalled();
  });

  it('checks the API once while the request is pending and announces success', async () => {
    let resolveRequest;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal('fetch', request);
    const user = userEvent.setup();
    render(<DevelopmentSetup />);

    await user.dblClick(screen.getByRole('button', { name: 'Check API connection' }));
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Checking the API connection');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('/api/health', { signal: expect.any(AbortSignal) });

    resolveRequest({ ok: true, json: async () => ({ status: 'ok' }) });
    expect(await screen.findByText(/The API is running/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Check API connection' })).toBeEnabled();
  });

  it.each([
    ['network failure', () => Promise.reject(new Error('private diagnostics'))],
    ['failed response', () => Promise.resolve({ ok: false })],
    [
      'invalid health status',
      () => Promise.resolve({ ok: true, json: async () => ({ status: 'down' }) }),
    ],
    [
      'invalid JSON',
      () =>
        Promise.resolve({
          ok: true,
          json: async () => {
            throw new Error('invalid JSON');
          },
        }),
    ],
  ])('offers a persistent retry after %s', async (_label, response) => {
    const request = vi
      .fn()
      .mockImplementationOnce(response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    vi.stubGlobal('fetch', request);
    const user = userEvent.setup();
    render(<DevelopmentSetup />);

    await user.click(screen.getByRole('button', { name: 'Check API connection' }));
    expect(await screen.findByText(/Cannot reach the API/)).toBeVisible();
    expect(screen.queryByText(/private diagnostics|invalid JSON/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/The API is running/)).toBeVisible();
  });
});
