import { useRef, useState } from 'react';
import { checkHealth } from '../services/health.js';

export function useApiHealth() {
  const [status, setStatus] = useState('idle');
  const pending = useRef(false);

  async function checkConnection() {
    if (pending.current) return;

    pending.current = true;
    setStatus('loading');

    try {
      await checkHealth();
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      pending.current = false;
    }
  }

  return { status, checkConnection };
}
