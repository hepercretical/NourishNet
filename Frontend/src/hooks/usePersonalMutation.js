import { useEffect, useRef, useState } from 'react';
import { accountRequest } from '../services/accounts.js';
export function usePersonalMutation(path, method = 'POST') {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const lock = useRef(false),
    attempt = useRef(null),
    controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function save(value, onSuccess) {
    if (lock.current) return;
    const signature = JSON.stringify(value);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    lock.current = true;
    setPending(true);
    setError('');
    setSaved(false);
    controller.current = new AbortController();
    try {
      const data = await accountRequest(`/personal/${path}`, {
        method,
        body: path === 'password' ? value : { ...value, requestKey: attempt.current.key },
        signal: controller.current.signal,
      });
      if (!controller.current.signal.aborted) {
        setSaved(true);
        onSuccess?.(data);
      }
    } catch (e) {
      if (!controller.current.signal.aborted)
        setError(
          e.status === 409
            ? 'These values changed elsewhere. Reload and review before saving.'
            : path === 'password'
              ? 'Password could not be changed. Check your current password and use 15–128 characters for the replacement. If the connection was lost, try signing in or use account recovery.'
              : 'Changes could not be saved. Your input is kept. Try again.',
        );
    } finally {
      lock.current = false;
      if (!controller.current.signal.aborted) setPending(false);
    }
  }
  return { pending, error, saved, save };
}
