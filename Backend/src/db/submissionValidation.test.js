import { expect, it } from 'vitest';
import { submissionDraft, submissionPhoto, photoLimit } from './submissionValidation.js';
const photo = {
  mime: 'image/jpeg',
  data: Buffer.from([255, 216, 255, 0, 1, 2]).toString('base64'),
};
const draft = () => ({
  barcode: '030000010402',
  productName: '',
  servingBasis: '',
  nutrients: { calories: null, protein: null, fat: null, carbohydrates: null, sodium: null },
  front: photo,
  label: photo,
  requestKey: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
});
it('accepts optional label fields without converting unknown values to zero and hashes photo bytes', () => {
  const result = submissionDraft(draft());
  expect(result.barcode.gtin14).toBe('00030000010402');
  expect(result.product.nutrients.sodium).toBeNull();
  expect(result.front).toMatchObject({
    mime: 'image/jpeg',
    size: 6,
    sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
  expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
});
it('checks exact fields, text, quantities, request keys and correction revisions', () => {
  for (const change of [
    { accountId: 'other' },
    { requestKey: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] },
    { productName: 'x'.repeat(201) },
    { servingBasis: 'x'.repeat(101) },
    { barcode: 'wrong' },
    { nutrients: { calories: -1 } },
    { front: null },
  ])
    expect(() => submissionDraft({ ...draft(), ...change })).toThrow();
  expect(() =>
    submissionDraft({ ...draft(), front: null, label: null, revision: 0 }, { correction: true }),
  ).toThrow();
  expect(
    submissionDraft({ ...draft(), front: null, label: null, revision: 1 }, { correction: true })
      .front,
  ).toBeNull();
});
it('rejects invalid base64, mime/signature mismatches and oversized files', () => {
  for (const value of [
    { mime: 'image/svg+xml', data: photo.data },
    { mime: 'image/png', data: photo.data },
    { mime: 'image/jpeg', data: 'not base64' },
    { mime: 'image/jpeg', data: '' },
  ])
    expect(() => submissionPhoto(value)).toThrow();
  expect(() =>
    submissionPhoto({ ...photo, data: 'A'.repeat(Math.ceil(photoLimit / 3) * 4 + 4) }),
  ).toThrow('5 MB');
  const png = {
    mime: 'image/png',
    data: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64'),
  };
  expect(submissionPhoto(png).mime).toBe('image/png');
  const webp = { mime: 'image/webp', data: Buffer.from('RIFF0000WEBP').toString('base64') };
  expect(submissionPhoto(webp).mime).toBe('image/webp');
});
it('canonicalizes nutrient key order for stable actor-scoped retry digests', () => {
  const one = draft(),
    two = draft();
  two.nutrients = Object.fromEntries(Object.entries(two.nutrients).reverse());
  expect(submissionDraft(one).digest).toBe(submissionDraft(two).digest);
  expect(submissionDraft({ ...one, productName: 'Changed' }).digest).not.toBe(
    submissionDraft(one).digest,
  );
});
