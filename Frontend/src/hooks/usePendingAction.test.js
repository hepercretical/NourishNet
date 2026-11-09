import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { usePendingAction } from './usePendingAction.js';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it('locks repeat actions before a render and releases the lock after a failed action', async () => {
  const request = deferred();
  const action = vi.fn().mockReturnValue(request.promise);
  const { result } = renderHook(usePendingAction);
  let first;
  act(() => {
    first = result.current.run(action);
    result.current.run(action);
  });
  expect(action).toHaveBeenCalledTimes(1);
  await act(async () => {
    request.reject(new Error('local fixture'));
    await first;
  });
  expect(result.current.failed).toBe(true);
  expect(result.current.pending).toBe(false);
  await act(async () => {
    await result.current.run(() => undefined);
  });
  expect(result.current.failed).toBe(false);
});
