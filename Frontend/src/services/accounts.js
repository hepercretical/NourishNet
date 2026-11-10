import { demoRequest, isLocalDemo } from './localDemo.js';

const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function accountRequest(path, { body, signal, method } = {}) {
  if (isLocalDemo() && !path.startsWith('/auth/')) {
    return demoRequest(path, { body, signal, method });
  }
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      signal,
      ...(body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
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
          ? 'Verify your fictional email before signing in.'
          : response.status === 400
            ? 'Check your entries. The code may be invalid or expired; request a new one if needed.'
            : 'The local service is unavailable. Your input is kept. Try again.',
    );
    error.status = response.status;
    if (response.status === 401 && !path.startsWith('/auth/'))
      window.dispatchEvent(new Event('nourishnet:expired'));
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
