import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import PageNotFound from './PageNotFound.jsx';
it('gives unavailable routes a focused landmark and a real diary destination', () => {
  render(<PageNotFound />);
  expect(screen.getByRole('main')).toHaveFocus();
  expect(screen.getByRole('link', { name: 'Open your diary' })).toHaveAttribute(
    'href',
    '#/app/dashboard',
  );
  expect(document.title).toBe('NourishNet | Page not found');
});
