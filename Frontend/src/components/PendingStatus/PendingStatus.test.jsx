import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import PendingStatus from './PendingStatus.jsx';
it('announces that an unreviewed food is unavailable for catalog reuse', () => {
  render(<PendingStatus />);
  expect(screen.getByRole('status')).toHaveTextContent(/Pending review/);
  expect(screen.getByRole('status')).toHaveTextContent(/not available as a reusable catalog food/);
});
