import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import TrackHub from './TrackHub.jsx';
it('offers real search, scan and submission paths for the selected day', () => {
  render(<TrackHub date="2026-11-12" />);
  expect(screen.getByText(/2026-11-12/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Search foods' })).toHaveAttribute(
    'href',
    '#/app/search',
  );
  expect(screen.getByRole('link', { name: /Scan barcode/ })).toHaveAttribute('href', '#/app/scan');
});
