import { accountRequest } from './accounts.js';
function encodedPhoto(file, signal) {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    function cleanup() {
      signal?.removeEventListener('abort', abort);
    }
    function abort() {
      reader.abort();
      cleanup();
      reject(new DOMException('Cancelled', 'AbortError'));
    }
    reader.onload = () => {
      cleanup();
      resolve({ mime: file.type, data: String(reader.result).split(',')[1] });
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error('The selected photo could not be read.'));
    };
    reader.onabort = () => {
      cleanup();
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    reader.readAsDataURL(file);
  });
}
export async function submitProduct(draft, { requestKey, signal, id, revision } = {}) {
  const [front, label] = await Promise.all([
    encodedPhoto(draft.front, signal),
    encodedPhoto(draft.label, signal),
  ]);
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const body = {
    barcode: draft.barcode.trim(),
    productName: draft.productName.trim(),
    servingBasis: draft.servingBasis.trim(),
    nutrients: Object.fromEntries(
      Object.entries(draft.nutrients).map(([name, value]) => [
        name,
        value === '' ? null : Number(value),
      ]),
    ),
    front,
    label,
    requestKey,
    ...(id ? { revision } : {}),
  };
  try {
    const result = await accountRequest(id ? `/submissions/${id}` : '/submissions', {
      body,
      method: id ? 'PATCH' : 'POST',
      signal,
    });
    if (!result?.submission?.id) throw new Error('Submission response unavailable.');
    return result.submission;
  } catch (error) {
    if (error.status === 409)
      throw Object.assign(
        new Error(
          'A submission already exists or has changed. Open My submissions and reload it before trying again.',
        ),
        { status: 409 },
      );
    throw error;
  }
}
export async function listSubmissions({ signal } = {}) {
  const result = await accountRequest('/submissions', { signal });
  if (!Array.isArray(result?.submissions)) throw new Error('Submissions could not be read.');
  return result.submissions;
}
export async function getSubmission(id, { signal } = {}) {
  const result = await accountRequest(`/submissions/${encodeURIComponent(id)}`, { signal });
  if (!result?.submission?.id) throw new Error('Submission could not be read.');
  return result.submission;
}
