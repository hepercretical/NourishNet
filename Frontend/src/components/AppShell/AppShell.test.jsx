import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import AppShell from './AppShell.jsx';
it('marks the active destination and lets keyboard users skip to page content', async () => {
  const user = userEvent.setup();
  render(
    <AppShell route="/dashboard">
      <main id="main-content" tabIndex={-1}>
        Diary content
      </main>
    </AppShell>,
  );
  const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
  expect(within(navigation).getByRole('link', { current: 'page' })).toHaveAttribute(
    'href',
    '#/dashboard',
  );
  await user.tab();
  expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('main')).toHaveFocus();
  expect(screen.getByText(/Fictional data only/)).toBeVisible();
  expect(within(navigation).getAllByRole('link')).toHaveLength(5);
  expect(screen.getByRole('link', { name: 'Try local diary without login' })).toHaveAttribute(
    'href',
    '?demo=1#/app/dashboard',
  );
});
