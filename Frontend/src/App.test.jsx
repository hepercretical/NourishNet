import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DevelopmentSetup from './pages/DevelopmentSetup.jsx';
import App from './App.jsx';

afterEach(() => vi.unstubAllGlobals());

it('opens the opt-in local diary at the root without checking authentication', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  window.history.replaceState({}, '', '/?demo=1');
  localStorage.clear();
  try {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Your daily diary' })).toBeVisible();
    expect(await screen.findByRole('region', { name: 'Recorded daily nutrition' })).toBeVisible();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    window.history.replaceState({}, '', '/');
  }
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
