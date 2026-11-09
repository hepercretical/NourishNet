import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useFoodSearch } from './useFoodSearch.js';
import { searchFoods } from '../services/foods.js';
vi.mock('../services/foods.js', () => ({ searchFoods: vi.fn() }));
beforeEach(() => {
  searchFoods.mockReset();
});

it('only searches on deliberate calls and not on renders, including empty and invalid input', async () => {
  searchFoods.mockResolvedValue([]);
  const { result, rerender } = renderHook(useFoodSearch);
  rerender();
  expect(searchFoods).not.toHaveBeenCalled();
  await act(() => result.current.search('  '));
  await act(() => result.current.search('a'.repeat(101)));
  expect(result.current.status).toBe('invalid');
  expect(searchFoods).not.toHaveBeenCalled();
  await act(() => result.current.search(' oats '));
  expect(result.current).toMatchObject({ status: 'success', foods: [], term: 'oats' });
  rerender();
  expect(searchFoods).toHaveBeenCalledOnce();
});

it('shows loading for delayed responses and ignores stale success and failure', async () => {
  let resolveOld, rejectOld, resolveLatest;
  searchFoods
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectOld = reject;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLatest = resolve;
        }),
    );
  const { result } = renderHook(useFoodSearch);
  act(() => {
    void result.current.search('old');
  });
  expect(result.current.status).toBe('loading');
  const firstSignal = searchFoods.mock.calls[0][1].signal;
  act(() => {
    void result.current.search('also old');
  });
  expect(firstSignal.aborted).toBe(true);
  act(() => {
    void result.current.search('latest');
  });
  await act(async () => {
    resolveLatest([{ name: 'Latest' }]);
  });
  await act(async () => {
    resolveOld([{ name: 'Old' }]);
    rejectOld(new Error('late failure'));
  });
  expect(result.current).toMatchObject({
    status: 'success',
    foods: [{ name: 'Latest' }],
    term: 'latest',
  });
});

it('clears old foods on a failed search and supports retry', async () => {
  searchFoods
    .mockResolvedValueOnce([{ name: 'Old' }])
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce([]);
  const { result } = renderHook(useFoodSearch);
  await act(() => result.current.search('old'));
  await act(() => result.current.search('new'));
  expect(result.current).toMatchObject({ status: 'error', foods: [], term: 'new' });
  await act(() => result.current.search(result.current.term));
  expect(result.current.status).toBe('success');
});

it('aborts pending work on unmount and tolerates a late completion', async () => {
  let resolve;
  searchFoods.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result, unmount } = renderHook(useFoodSearch);
  act(() => {
    void result.current.search('oats');
  });
  const signal = searchFoods.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => resolve([]));
  await waitFor(() => expect(searchFoods).toHaveBeenCalledOnce());
});
