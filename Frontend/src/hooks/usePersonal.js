import { useEffect, useState } from 'react';
import { accountRequest } from '../services/accounts.js';

export function usePersonal(path) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ path, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    accountRequest(`/personal/${path}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ path, data, loading: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ path, error: true, loading: false });
      });
    return () => controller.abort();
  }, [path, attempt]);
  return {
    ...(state.path === path ? state : { loading: true }),
    reload: () => {
      setState({ path, loading: true });
      setAttempt((n) => n + 1);
    },
  };
}
