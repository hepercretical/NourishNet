const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function checkHealth() {
  const response = await fetch(`${apiBaseUrl}/health`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok || (await response.json()).status !== 'ok') {
    throw new Error('API connection unavailable');
  }
}
