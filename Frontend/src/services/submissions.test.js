import { afterEach, expect, it, vi } from 'vitest';
import { submitProduct, listSubmissions, getSubmission } from './submissions.js';
import { accountRequest } from './accounts.js';
import { emptySubmission } from '../utils/submissionDraft.js';
vi.mock('./accounts.js', () => ({ accountRequest: vi.fn() }));
afterEach(() => vi.resetAllMocks());
it('encodes two photos, preserves unknown nutrition and forwards one stable caller request key', async () => {
  const draft = {
    ...emptySubmission('030000010402'),
    front: new File(['front'], 'front.jpg', { type: 'image/jpeg' }),
    label: new File(['label'], 'label.png', { type: 'image/png' }),
  };
  accountRequest.mockResolvedValue({ submission: { id: 'record', status: 'pending' } });
  const signal = new AbortController().signal;
  expect(await submitProduct(draft, { requestKey: 'same-key', signal })).toEqual({
    id: 'record',
    status: 'pending',
  });
  expect(accountRequest).toHaveBeenCalledWith(
    '/submissions',
    expect.objectContaining({
      signal,
      method: 'POST',
      body: expect.objectContaining({
        requestKey: 'same-key',
        nutrients: { calories: null, protein: null, fat: null, carbohydrates: null, sodium: null },
        front: { mime: 'image/jpeg', data: 'ZnJvbnQ=' },
        label: { mime: 'image/png', data: 'bGFiZWw=' },
      }),
    }),
  );
});
it('retains existing photos in a correction and handles cancellation/conflict without a new identity', async () => {
  const draft = emptySubmission('030000010402');
  accountRequest
    .mockResolvedValueOnce({ submission: { id: 'record' } })
    .mockRejectedValueOnce(Object.assign(new Error('private'), { status: 409 }));
  await submitProduct(draft, { id: 'record', revision: 2, requestKey: 'key' });
  expect(accountRequest).toHaveBeenCalledWith(
    '/submissions/record',
    expect.objectContaining({
      method: 'PATCH',
      body: expect.objectContaining({ revision: 2, front: null, label: null }),
    }),
  );
  await expect(submitProduct(draft, { requestKey: 'key' })).rejects.toThrow('Open My submissions');
  const controller = new AbortController();
  controller.abort();
  await expect(submitProduct(draft, { signal: controller.signal })).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(accountRequest).toHaveBeenCalledTimes(2);
});
it('validates list/detail response shapes and preserves read cancellation', async () => {
  const signal = new AbortController().signal;
  accountRequest
    .mockResolvedValueOnce({ submissions: [] })
    .mockResolvedValueOnce({ submission: { id: 'record' } })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({});
  expect(await listSubmissions({ signal })).toEqual([]);
  expect(await getSubmission('record', { signal })).toEqual({ id: 'record' });
  expect(accountRequest).toHaveBeenCalledWith('/submissions', { signal });
  await expect(listSubmissions()).rejects.toThrow('could not be read');
  await expect(getSubmission('record')).rejects.toThrow('could not be read');
});
