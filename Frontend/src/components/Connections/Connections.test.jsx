import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Connections from './Connections.jsx';
it('shows only the explicitly requested coming-soon content', () => {
  render(<Connections />);
  expect(screen.getByRole('heading', { name: 'Connections' })).toBeVisible();
  expect(screen.getByText('Coming Soon...')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
