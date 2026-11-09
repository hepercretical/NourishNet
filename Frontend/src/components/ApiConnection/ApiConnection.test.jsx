import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ApiConnection from './ApiConnection.jsx';

afterEach(() => vi.unstubAllGlobals());

describe('API connection', () => {
  it('explains the internal setup before making a connection check', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<ApiConnection />);

    expect(screen.getByRole('heading', { level: 2, name: 'Local API connection' })).toBeVisible();
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
    render(<ApiConnection />);

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
    render(<ApiConnection />);

    await user.click(screen.getByRole('button', { name: 'Check API connection' }));
    expect(await screen.findByText(/Cannot reach the API/)).toBeVisible();
    expect(screen.queryByText(/private diagnostics|invalid JSON/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/The API is running/)).toBeVisible();
  });
});
