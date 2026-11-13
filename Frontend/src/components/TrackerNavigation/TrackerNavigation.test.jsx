import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import TrackerNavigation from './TrackerNavigation.jsx';

it('opens the menu with the keyboard and exposes only working live destinations', async () => {
  const user = userEvent.setup();
  render(
    <TrackerNavigation route="/app/dashboard">
      <button>Sign out</button>
    </TrackerNavigation>,
  );
  const menu = screen.getByRole('button', { name: 'Menu' });
  expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('navigation', { name: 'Tracker menu' })).not.toBeInTheDocument();
  menu.focus();
  await user.keyboard('{Enter}');
  expect(menu).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('link', { name: 'Scan a product' })).toHaveAttribute(
    'href',
    '#/app/scan',
  );
  expect(screen.getByRole('link', { name: 'My submissions' })).toHaveAttribute(
    'href',
    '#/app/submissions',
  );
  expect(screen.queryByText(/preview|planned|All screen designs/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await user.click(screen.getByRole('link', { name: 'Daily diary' }));
  expect(menu).toHaveAttribute('aria-expanded', 'false');
});

it('keeps search reachable and marks the current bottom tab', () => {
  render(<TrackerNavigation route="/app/search" />);
  expect(screen.getByRole('link', { name: 'Search foods to log' })).toHaveAttribute(
    'href',
    '#/app/search',
  );
  const nav = screen.getByRole('navigation', { name: 'Main navigation' });
  expect(within(nav).getByRole('link', { name: 'Track' })).toHaveAttribute('aria-current', 'page');
  expect(within(nav).getAllByRole('link')).toHaveLength(5);
  expect(within(nav).queryByRole('link', { name: 'Designs' })).not.toBeInTheDocument();
  expect(within(nav).getByRole('link', { name: 'Preferences' })).toHaveAttribute(
    'href',
    '#/app/settings',
  );
});

it('opens the real scan route from the toolbar and marks Track active', () => {
  render(<TrackerNavigation route="/app/scan" />);
  expect(screen.getByRole('link', { name: 'Scan a food barcode' })).toHaveAttribute(
    'href',
    '#/app/scan',
  );
  expect(screen.getByRole('link', { name: 'Track' })).toHaveAttribute('aria-current', 'page');
});

it.each([
  ['/scan/manual', 'Track'],
  ['/submissions/new', 'Track'],
  ['/review', 'Track'],
  ['/calendar/comparison', 'Stats'],
  ['/goals/setup', 'Preferences'],
  ['/account/recovery', 'Preferences'],
  ['/settings/rights', 'Preferences'],
  ['/privacy', 'Preferences'],
  ['/design/components', 'Designs'],
])(
  'marks the section for preview route %s without redirecting to account-only search',
  (route, tab) => {
    render(<TrackerNavigation route={route} preview />);
    const tabs = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(tabs).getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getAllByRole('link', { current: 'page' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Search foods to log' })).toHaveAttribute(
      'href',
      '#/search',
    );
  },
);

it('closes the preview menu with Escape and returns focus to its button', async () => {
  const user = userEvent.setup();
  render(<TrackerNavigation route="/calendar" preview />);
  const button = screen.getByRole('button', { name: 'Menu' });
  await user.click(button);
  const goals = within(screen.getByRole('navigation', { name: 'Tracker menu' })).getByRole('link', {
    name: 'Goals',
  });
  goals.focus();
  await user.keyboard('{Escape}');
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(button).toHaveFocus();
});
