import { createHash } from 'node:crypto';
import { AccountError } from '../auth/service.js';
import { normalizeBarcode } from './barcodes.js';
import { nutritionAmount } from './validation.js';

export const photoLimit = 5 * 1024 * 1024;
export const submissionBodyLimit = 15 * 1024 * 1024;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nutrientNames = ['calories', 'carbohydrates', 'fat', 'protein', 'sodium'];
function exact(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',')
  );
}
export function submissionPhoto(value, { optional = false } = {}) {
  if (value === null && optional) return null;
  if (!exact(value, ['mime', 'data']) || typeof value.data !== 'string')
    throw new AccountError('Supply both product photos.');
  if (value.data.length > Math.ceil(photoLimit / 3) * 4)
    throw new AccountError('Each photo must be at most 5 MB.', 413);
  if (value.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value.data))
    throw new AccountError('Send a complete base64 photo.');
  const bytes = Buffer.from(value.data, 'base64');
  if (bytes.toString('base64') !== value.data)
    throw new AccountError('Send a complete base64 photo.');
  if (!bytes.length || bytes.length > photoLimit)
    throw new AccountError('Each photo must be between 1 byte and 5 MB.', 413);
  const valid =
    value.mime === 'image/jpeg'
      ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : value.mime === 'image/png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : value.mime === 'image/webp'
          ? bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP'
          : false;
  if (!valid) throw new AccountError('Use a JPEG, PNG or WebP photo with matching contents.', 415);
  return {
    bytes,
    mime: value.mime,
    size: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
export function submissionDraft(body, { correction = false } = {}) {
  const keys = [
    'barcode',
    'productName',
    'servingBasis',
    'nutrients',
    'front',
    'label',
    'requestKey',
    ...(correction ? ['revision'] : []),
  ];
  if (
    !exact(body, keys) ||
    typeof body.requestKey !== 'string' ||
    !uuidPattern.test(body.requestKey) ||
    typeof body.productName !== 'string' ||
    body.productName.trim().length > 200 ||
    typeof body.servingBasis !== 'string' ||
    body.servingBasis.trim().length > 100 ||
    !exact(body.nutrients, nutrientNames)
  )
    throw new AccountError('Check the product fields and photos.');
  if (correction && (!Number.isSafeInteger(body.revision) || body.revision < 1))
    throw new AccountError('Reload the submission before correcting it.');
  const barcode = normalizeBarcode(body.barcode);
  try {
    for (const value of Object.values(body.nutrients)) nutritionAmount(value, { nullable: true });
  } catch {
    throw new AccountError(
      'Use nonnegative nutrition amounts with at most four decimal places, or leave unknown values blank.',
    );
  }
  const front = submissionPhoto(body.front, { optional: correction }),
    label = submissionPhoto(body.label, { optional: correction });
  const product = {
    productName: body.productName.trim(),
    servingBasis: body.servingBasis.trim(),
    nutrients: Object.fromEntries(nutrientNames.map((name) => [name, body.nutrients[name]])),
  };
  const digest = createHash('sha256')
    .update(
      JSON.stringify([
        barcode.gtin14,
        product,
        front?.sha256 || null,
        label?.sha256 || null,
        body.revision || null,
      ]),
    )
    .digest('hex');
  return {
    barcode,
    product,
    front,
    label,
    digest,
    requestKey: body.requestKey.toLowerCase(),
    revision: body.revision,
  };
}
