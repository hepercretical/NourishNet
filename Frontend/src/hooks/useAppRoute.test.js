import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useAppRoute } from './useAppRoute.js';
it('defaults to the real diary independently of demo query flags and follows hash navigation', () => {
  window.history.replaceState({}, '', '/?demo=1');
  const view = renderHook(() => useAppRoute());
  expect(view.result.current).toBe('/app/dashboard');
  act(() => {
    window.location.hash = '/app/scan';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  expect(view.result.current).toBe('/app/scan');
  view.unmount();
  window.history.replaceState({}, '', '/');
});
