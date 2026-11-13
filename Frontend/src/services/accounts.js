import { demoRequest, isLocalDemo } from './localDemo.js';
import { usesNeonAuth } from './hostedConfig.js';

const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function accountRequest(path, { body, signal, method } = {}) {
  if (isLocalDemo() && !path.startsWith('/auth/')) {
    return demoRequest(path, { body, signal, method });
  }
  let token;
  if (usesNeonAuth) {
    const { neonAuthRequest, neonToken } = await import('./neonAuth.js');
    if (path.startsWith('/auth/') && !['/auth/session', '/auth/profile'].includes(path)) {
      const result = await neonAuthRequest(path, body);
      if (path !== '/auth/login') return result;
      return accountRequest('/auth/session', { signal });
    }
    token = await neonToken();
    if (!token) {
      const error = Object.assign(new Error('Sign in again.'), { status: 401 });
      if (!path.startsWith('/auth/')) window.dispatchEvent(new Event('nourishnet:expired'));
      throw error;
    }
  }
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      signal,
      ...(token || body !== undefined
        ? {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            },
          }
        : {}),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the local API. Your input is kept. Try again.', { cause: error });
  }
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? 'Email or password is incorrect, or your session expired. Sign in again.'
        : response.status === 403
          ? usesNeonAuth
            ? 'This test account needs verification, completed setup, or tester approval.'
            : 'Verify your fictional email before signing in.'
          : response.status === 400
            ? 'Check your entries. The code may be invalid or expired; request a new one if needed.'
            : usesNeonAuth
              ? 'The hosted service is unavailable. Your input is kept. Try again.'
              : 'The local service is unavailable. Your input is kept. Try again.',
    );
    error.status = response.status;
    if (response.status === 401 && !path.startsWith('/auth/'))
      window.dispatchEvent(new Event('nourishnet:expired'));
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
