import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { estimateNotice, screens } from './design/screens.js';

function openRoute(path) {
  window.history.replaceState(null, '', `#${path}`);
}

beforeEach(() => openRoute('/dashboard'));
afterEach(() => vi.unstubAllGlobals());

describe('initial screen designs', () => {
  it('offers profile, goals and password recovery from Preferences', async () => {
    const user = userEvent.setup();
    openRoute('/settings');
    render(<App />);
    const links = screen.getByRole('navigation', { name: 'Flow preview links' });
    expect(within(links).getByRole('link', { name: 'My profile (preview)' })).toHaveAttribute(
      'href',
      '#/account',
    );
    expect(within(links).getByRole('link', { name: 'Change password (preview)' })).toHaveAttribute(
      'href',
      '#/account/recovery',
    );
    await user.click(within(links).getByRole('link', { name: 'Daily goals (preview)' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Choose a goal' })).toBeVisible();
  });
  it.each(Object.entries(screens))(
    'opens %s with one heading and valid next destinations',
    (path, design) => {
      openRoute(path);
      render(<App />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(design.title);
      expect(document.title).toBe(`NourishNet | ${design.title}`);
      expect(screen.getByRole('banner')).toBeVisible();
      expect(screen.getByRole('main')).toHaveFocus();
      expect(screen.getByRole('contentinfo')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(screen.getByRole('link', { name: 'Search foods to log' })).toHaveAttribute(
        'href',
        '#/search',
      );
      const tabs = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(
        within(tabs)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Dashboard'),
          expect.stringContaining('Stats'),
          expect.stringContaining('Track'),
          expect.stringContaining('Designs'),
          expect.stringContaining('Preferences'),
        ]),
      );
      expect(within(tabs).getAllByRole('link')).toHaveLength(5);
      for (const [target] of design.links) expect(screens[target]).toBeDefined();
    },
  );

  it('navigates using links and responds to history changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(
      within(screen.getByRole('navigation', { name: 'Tracker menu' })).getByRole('link', {
        name: 'Goals',
      }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Choose a goal' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Preferences', current: 'page' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'Goals', current: 'page' })).toBeVisible();
    await act(async () => {
      openRoute('/dashboard');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Your daily diary' })).toBeVisible();
  });

  it('lets keyboard users skip navigation without changing the route', async () => {
    const user = userEvent.setup();
    render(<App />);
    screen.getByRole('link', { name: 'Skip to main content' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.hash).toBe('#/dashboard');
  });

  it('moves Stats focus to the preview daily summary without leaving the diary', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
        name: 'Stats',
      }),
    );
    expect(screen.getByRole('heading', { name: /November 9, 2026/ })).toHaveFocus();
    expect(window.location.hash).toBe('#/dashboard');
  });

  it.each(['/design', '/design/components', '/development', '/unknown'])(
    'keeps the same toolbar, tabs and focusable main on utility route %s',
    (path) => {
      openRoute(path);
      render(<App />);
      expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'Search foods to log' })).toHaveAttribute(
        'href',
        '#/search',
      );
      expect(
        within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('link'),
      ).toHaveLength(5);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('main')).toHaveFocus();
    },
  );

  it('shows loading, persistent error with retry, empty, validation and success patterns', async () => {
    const user = userEvent.setup();
    openRoute('/food/confirm');
    render(<App />);
    const states = screen.getByRole('combobox', { name: 'Preview state' });
    await user.selectOptions(states, 'Loading');
    expect(screen.getByRole('status')).toHaveTextContent(/Loading/);
    expect(screen.queryByRole('textbox', { name: 'Serving amount' })).not.toBeInTheDocument();
    await user.selectOptions(states, 'Error');
    expect(screen.getByRole('alert')).toHaveTextContent(/try again/);
    await user.click(screen.getByRole('button', { name: 'Try again (preview)' }));
    expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveValue('1.5');
    await user.selectOptions(states, 'Empty');
    expect(screen.getByRole('status')).toHaveTextContent(/Nothing to show/);
    await user.selectOptions(states, 'Validation');
    expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveAccessibleDescription(
      /greater than zero/,
    );
    expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await user.selectOptions(states, 'Success');
    expect(screen.getByRole('status')).toHaveTextContent(/saved once/);
  });

  it('keeps previews local and operations unavailable', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    const user = userEvent.setup();
    openRoute('/submissions/new');
    render(<App />);
    expect(
      screen.getByRole('button', { name: 'Submit for review (unavailable in preview)' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose package front' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Product name' })).toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Preview state' }), 'Loading');
    expect(screen.getByRole('status')).toHaveTextContent(/duplicate submit actions are disabled/);
    expect(request).not.toHaveBeenCalled();
  });

  it('shows the estimate notice beside unavailable values and saving', () => {
    openRoute('/goals/estimate');
    render(<App />);
    expect(screen.getByText(estimateNotice)).toBeVisible();
    expect(screen.getByText(/Calories: Not calculated/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Accept and save goal (unavailable in preview)' }),
    ).toBeDisabled();
  });

  it('leaves sharing off', () => {
    openRoute('/connections/sharing');
    render(<App />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('offers an announced calendar day list and month controls with neutral states', async () => {
    const user = userEvent.setup();
    openRoute('/calendar/comparison');
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeVisible();
    const days = screen.getByRole('combobox', { name: 'Day details' });
    expect(within(days).getAllByRole('option')).toHaveLength(31);
    await user.selectOptions(days, '31');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Selected: December 31, 2026 · You: No data · Morgan: Not shared',
    );
    expect(screen.getByText(/None of these states means a failed goal/)).toBeVisible();
    expect(screen.queryByText(/225 kcal/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(within(days).getAllByRole('option')).toHaveLength(30);
    expect(days).toHaveValue('30');
  });

  it('provides a full review map and custom not-found recovery', () => {
    openRoute('/design');
    const { unmount } = render(<App />);
    expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(
      Object.keys(screens).length,
    );
    unmount();
    openRoute('/unknown');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse all screen designs' })).toHaveAttribute(
      'href',
      '#/design',
    );
  });
});
