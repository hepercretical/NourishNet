import { randomUUID, createHash } from 'node:crypto';
import { AccountError } from '../auth/service.js';
import { uuidPattern } from '../db/submissionValidation.js';

const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const photoLimit = 2 * 1024 * 1024;
const totalLimit = 100 * 1024 * 1024;
function ownerOf(key) {
  const parts = typeof key === 'string' ? key.split('/') : [];
  if (
    parts.length !== 3 ||
    !uuidPattern.test(parts[0]) ||
    !uuidPattern.test(parts[1]) ||
    !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(parts[2]) ||
    !uuidPattern.test(parts[2].split('.')[0])
  )
    throw new Error('Invalid private photo reference.');
  return parts[0];
}

export function hostedPhotoStore(database, { budgetBytes = totalLimit } = {}) {
  if (!Number.isSafeInteger(budgetBytes) || budgetBytes < 1 || budgetBytes > totalLimit)
    throw new Error('Select a private photo budget within the approved cap.');
  return {
    async save(accountId, submissionId, photo) {
      if (!uuidPattern.test(accountId) || !uuidPattern.test(submissionId))
        throw new Error('Invalid photo owner.');
      if (
        !Buffer.isBuffer(photo.bytes) ||
        !extensions[photo.mime] ||
        !photo.bytes.length ||
        photo.bytes.length > photoLimit
      )
        throw new AccountError(
          'Each hosted photo must be between 1 byte and 2 MB. Choose a smaller image.',
          413,
        );
      const key = `${accountId}/${submissionId}/${randomUUID()}.${extensions[photo.mime]}`;
      const client = await database.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [2026111310]);
        const used = await client.query(
          'SELECT COALESCE(SUM(byte_size),0) AS bytes FROM hosted_submission_photos',
        );
        if (Number(used.rows[0].bytes) + photo.bytes.length > budgetBytes)
          throw new AccountError(
            'Photo storage is full for this test release. Your input is kept; contact the developer.',
            507,
          );
        await client.query(
          `INSERT INTO hosted_submission_photos
          (storage_key,account_id,submission_id,content_type,byte_size,sha256,contents)
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            key,
            accountId,
            submissionId,
            photo.mime,
            photo.bytes.length,
            createHash('sha256').update(photo.bytes).digest('hex'),
            photo.bytes,
          ],
        );
        await client.query('COMMIT');
        return key;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
    async read(key) {
      const owner = ownerOf(key);
      const result = await database.query(
        'SELECT contents FROM hosted_submission_photos WHERE storage_key=$1 AND account_id=$2',
        [key, owner],
      );
      if (!result.rows[0]) throw new AccountError('Photo not found.', 404);
      return result.rows[0].contents;
    },
    async discard(keys) {
      for (const key of keys) {
        const owner = ownerOf(key);
        await database.query(
          'DELETE FROM hosted_submission_photos WHERE storage_key=$1 AND account_id=$2',
          [key, owner],
        );
      }
    },
  };
}
