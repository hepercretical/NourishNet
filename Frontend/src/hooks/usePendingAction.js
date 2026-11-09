import { useRef, useState } from 'react';

// Lock immediately, before React renders, so rapid clicks and Enter presses stay one action.
// The caller owns the data and supplies product copy; caught service errors never reach the UI.
export function usePendingAction() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function run(action) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setFailed(false);
    try {
      await action();
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return { pending, failed, run };
}
