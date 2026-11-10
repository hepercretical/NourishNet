import { createHash } from 'node:crypto';
import { AccountError } from '../auth/service.js';
import { localDate, nutritionAmount } from './validation.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function mutationDraft(id, body, remove = false) {
  const keys = remove ? 'date,requestKey,revision' : 'date,meal,quantity,requestKey,revision';
  if (
    !uuid.test(id) ||
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).sort().join(',') !== keys ||
    !uuid.test(body.requestKey) ||
    !Number.isSafeInteger(body.revision) ||
    body.revision < 1 ||
    body.revision >= 2147483647
  )
    throw new AccountError('Reload the diary and review this entry again.');
  try {
    localDate(body.date);
    if (!remove) nutritionAmount(body.quantity, { positive: true });
  } catch {
    throw new AccountError(
      'Use a real local date and a positive amount with at most four decimal places.',
    );
  }
  if (!remove && !['breakfast', 'lunch', 'dinner', 'snack'].includes(body.meal))
    throw new AccountError('Choose Breakfast, Lunch, Dinner, or Snack.');
  return { ...body, requestKey: body.requestKey.toLowerCase(), id: id.toLowerCase() };
}

export function diaryMutations(database, serializeEntry) {
  async function mutate(account, id, input, remove) {
    const draft = mutationDraft(id, input, remove);
    const operation = remove ? 'diary.remove' : 'diary.update';
    const digest = createHash('sha256')
      .update(
        JSON.stringify([
          draft.id,
          draft.date,
          draft.revision,
          ...(remove ? [] : [draft.quantity, draft.meal]),
        ]),
      )
      .digest('hex');
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [account.id]);
      const prior = await client.query(
        `SELECT request_digest, response_body FROM write_requests
         WHERE account_id = $1 AND operation = $2 AND request_key = $3`,
        [account.id, operation, draft.requestKey],
      );
      if (prior.rows.length) {
        if (prior.rows[0].request_digest !== digest)
          throw new AccountError('This request key was already used for a different change.', 409);
        await client.query('COMMIT');
        return prior.rows[0].response_body;
      }
      const found = await client.query(
        `SELECT e.* FROM diary_entries e JOIN diary_days d ON d.id = e.day_id
         WHERE e.id = $1 AND d.account_id = $2 AND d.local_date = $3::date FOR UPDATE OF e, d`,
        [draft.id, account.id, draft.date],
      );
      const current = found.rows[0];
      if (!current)
        throw new AccountError('This diary entry is unavailable. Reload your diary.', 404);
      if (current.revision !== draft.revision)
        throw new AccountError('This entry changed. Reload your diary and review it again.', 409);
      let body;
      if (remove) {
        await client.query('DELETE FROM diary_entries WHERE id = $1 AND day_id = $2', [
          draft.id,
          current.day_id,
        ]);
        body = { date: draft.date, removedId: draft.id };
      } else {
        const updated = await client.query(
          `UPDATE diary_entries SET quantity = $1, meal = $2, revision = revision + 1
           WHERE id = $3 AND day_id = $4 RETURNING *`,
          [draft.quantity, draft.meal, draft.id, current.day_id],
        );
        body = { date: draft.date, entry: serializeEntry(updated.rows[0]) };
      }
      await client.query('UPDATE diary_days SET revision = revision + 1 WHERE id = $1', [
        current.day_id,
      ]);
      await client.query(
        `INSERT INTO write_requests (account_id, operation, request_key, request_digest,
         response_status, response_body) VALUES ($1, $2, $3, $4, 200, $5::jsonb)`,
        [account.id, operation, draft.requestKey, digest, JSON.stringify(body)],
      );
      await client.query('COMMIT');
      return body;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    update: (account, id, body) => mutate(account, id, body, false),
    remove: (account, id, body) => mutate(account, id, body, true),
  };
}
