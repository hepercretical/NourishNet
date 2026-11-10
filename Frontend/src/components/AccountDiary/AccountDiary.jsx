import { useEffect, useState } from 'react';
import { accountRequest } from '../../services/accounts.js';
import Dashboard from '../Dashboard/Dashboard.jsx';

export default function AccountDiary({ account, date }) {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    accountRequest(`/diary?date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then((diary) => {
        if (!controller.signal.aborted && diary.date === date) setState({ diary, loading: false });
        else if (!controller.signal.aborted) setState({ error: true, loading: false });
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted)
          setState({ error: true, loading: false });
      });
    return () => controller.abort();
  }, [account.id, date, attempt]);
  return (
    <Dashboard
      account={account}
      {...state}
      onRetry={() => {
        setState({ loading: true });
        setAttempt((current) => current + 1);
      }}
    />
  );
}
