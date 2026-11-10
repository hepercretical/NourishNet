import { useEffect, useRef, useState } from 'react';
import { accountRequest } from '../../services/accounts.js';
import Dashboard from '../Dashboard/Dashboard.jsx';

export default function AccountDiary({ account, date }) {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState('');
  const mutation = useRef(null);
  const [busy, setBusy] = useState(false);
  const container = useRef(null);
  const focusAfterLoad = useRef(false);
  useEffect(() => () => mutation.current?.abort(), [account.id, date]);
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
  useEffect(() => {
    if (state.diary && focusAfterLoad.current) {
      focusAfterLoad.current = false;
      container.current?.querySelector('h1')?.focus();
    }
  }, [state.diary]);
  async function change(entry, mode, values, requestKey) {
    if (mutation.current) throw new Error('Wait for the current change.');
    const controller = new AbortController();
    mutation.current = controller;
    setBusy(true);
    try {
      await accountRequest(`/diary/entries/${entry.id}`, {
        method: mode === 'edit' ? 'PATCH' : 'DELETE',
        signal: controller.signal,
        body: { date, revision: entry.revision, requestKey, ...values },
      });
      if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      setNotice(
        `${entry.foodName} ${mode === 'edit' ? 'updated' : 'removed'}. Reloading recorded totals.`,
      );
      focusAfterLoad.current = true;
      setState({ loading: true });
      setAttempt((current) => current + 1);
    } finally {
      mutation.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <div ref={container}>
      {notice && <p role="status">{notice}</p>}
      {state.diary && (
        <button
          type="button"
          className="shared-button shared-button--secondary"
          disabled={busy}
          onClick={() => {
            focusAfterLoad.current = true;
            setState({ loading: true });
            setAttempt((current) => current + 1);
          }}
        >
          Reload diary
        </button>
      )}
      <Dashboard
        account={account}
        {...state}
        onEntryChange={change}
        onRetry={() => {
          setState({ loading: true });
          setAttempt((current) => current + 1);
        }}
      />
    </div>
  );
}
