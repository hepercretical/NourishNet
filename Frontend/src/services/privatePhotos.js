// Only the owned, same-origin submission endpoint may receive a session token.
const photoPath =
  /^\/api\/submissions\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/photos\/(front|label)$/i;
const limit = 2 * 1024 * 1024;
export async function loadPrivatePhoto(path, { signal } = {}) {
  if (!photoPath.test(path)) throw new Error('Invalid photo address.');
  const { neonToken } = await import('./neonAuth.js');
  const token = await neonToken();
  if (!token) throw new Error('Sign in again to view this photo.');
  const response = await fetch(path, {
    signal,
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'error',
    headers: { Authorization: `Bearer ${token}` },
  });
  const type = response.headers.get('content-type');
  if (
    !response.ok ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(type) ||
    Number(response.headers.get('content-length')) > limit
  )
    throw new Error('This photo could not be loaded. Try again.');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('This photo is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error('This photo is empty.');
  return new Blob(chunks, { type });
}
