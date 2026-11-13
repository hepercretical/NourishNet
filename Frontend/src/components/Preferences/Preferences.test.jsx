import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Preferences from './Preferences.jsx';
it('shows saved account details and only working destinations', () => {
  render(
    <Preferences account={{ displayName: 'Local catalog tester 1', timeZone: 'America/Denver' }} />,
  );
  expect(screen.getByText('Local catalog tester 1')).toBeVisible();
  expect(screen.getByText('America/Denver')).toBeVisible();
  expect(screen.getByRole('link', { name: 'My submissions' })).toHaveAttribute(
    'href',
    '#/app/submissions',
  );
  expect(screen.queryByText(/preview|planned|coming soon/i)).not.toBeInTheDocument();
});
