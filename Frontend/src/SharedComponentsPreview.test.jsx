import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

vi.mock('./design/sharedExamples.js', async (importOriginal) => ({
  ...(await importOriginal()),
  previewAction: vi.fn().mockResolvedValue(undefined),
}));
import { previewAction } from './design/sharedExamples.js';

beforeEach(() => {
  window.history.replaceState(null, '', '#/design/components');
  previewAction.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());

describe('shared components preview', () => {
  it('opens from the review map with a focused landmark and one page heading', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '#/design');
    render(<App />);
    await user.click(
      screen.getByRole('link', { name: 'Try shared food, form, and state components' }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Shared components' }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveFocus();
    expect(document.title).toBe('NourishNet | Shared components');
  });

  it('keeps search and serving choices when moving back and confirms without a network call', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Search foods' }), 'oats{Enter}');
    await user.click(screen.getByRole('button', { name: /^Choose Sample rolled oats/ }));
    const input = screen.getByRole('textbox', { name: 'Serving amount' });
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.type(input, '2.25');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Meal' }), 'Dinner');
    await user.click(screen.getByRole('button', { name: 'Back to search' }));
    expect(screen.getByRole('searchbox', { name: 'Search foods' })).toHaveValue('oats');
    expect(screen.getByRole('searchbox', { name: 'Search foods' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: /^Choose Sample rolled oats/ }));
    expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveValue('2.25');
    expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Dinner');
    await user.click(screen.getByRole('button', { name: 'Confirm preview' }));
    expect(screen.getByText(/2.25 servings.*Dinner. Nothing was saved/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('offers no results and recovers from a failed search with the same input', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Preview response' }), 'empty');
    await user.type(screen.getByRole('searchbox', { name: 'Search foods' }), 'oats{Enter}');
    expect(screen.getByText('No foods found')).toBeVisible();
    previewAction.mockRejectedValueOnce(new Error('private diagnostic'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Preview response' }), 'error');
    await user.click(screen.getByRole('button', { name: 'Search foods' }));
    const form = screen.getByRole('form', { name: 'Food search' });
    expect(within(form).getByRole('alert')).toHaveTextContent(/Your search text is kept/);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Preview response' }), 'success');
    await user.click(within(form).getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('searchbox', { name: 'Search foods' })).toHaveValue('oats');
    expect(screen.getByRole('button', { name: /^Choose Sample rolled oats/ })).toBeVisible();
    expect(within(form).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces a slow search and prevents repeated search actions', async () => {
    let resolve;
    previewAction.mockReturnValueOnce(
      new Promise((yes) => {
        resolve = yes;
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Search foods' }), 'oats');
    await user.dblClick(screen.getByRole('button', { name: 'Search foods' }));
    expect(previewAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled();
    await act(async () => resolve());
    expect(screen.getByRole('button', { name: /^Choose Sample rolled oats/ })).toBeVisible();
  });
});
