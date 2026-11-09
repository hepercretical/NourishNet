import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../DataState/DataState.jsx';
import { ErrorState } from '../DataState/DataState.jsx';
import { LoadingState } from '../DataState/DataState.jsx';

it('announces loading and empty states and offers persistent retry and empty recovery controls', async () => {
  const user = userEvent.setup();
  const retry = vi.fn();
  const add = vi.fn();
  render(
    <>
      <LoadingState />
      <EmptyState title="No foods yet" actionLabel="Find food" onAction={add}>
        Search for a food to start your diary.
      </EmptyState>
      <ErrorState onRetry={retry} />
    </>,
  );
  expect(screen.getAllByRole('status')).toHaveLength(2);
  expect(screen.getByRole('alert')).toHaveTextContent('Foods could not be loaded. Try again.');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('alert')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Find food' }));
  expect(add).toHaveBeenCalledTimes(1);
});
