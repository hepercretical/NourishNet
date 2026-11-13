import { randomUUID } from 'node:crypto';
import { AccountError } from '../auth/service.js';
import { submissionDraft, uuidPattern } from './submissionValidation.js';

function publicSubmission(row) {
  return {
    id: row.id,
    barcode: row.gtin14,
    productName: row.product.productName,
    servingBasis: row.product.servingBasis,
    nutrients: row.product.nutrients,
    status: row.status,
    revision: row.revision,
    createdAt: new Date(row.created_at).toISOString(),
    reviewNote: row.review_note || '',
    photos: {
      front: `/api/submissions/${row.id}/photos/front`,
      label: `/api/submissions/${row.id}/photos/label`,
    },
  };
}
const detailSql = `SELECT s.*, (SELECT r.note FROM submission_reviews r WHERE r.submission_id=s.id ORDER BY r.reviewed_at DESC, r.id DESC LIMIT 1) AS review_note
 FROM submissions s WHERE s.id=$1 AND s.account_id=$2`;
export function submissionRepository(database, photos) {
  async function owned(account, id) {
    if (!uuidPattern.test(id)) throw new AccountError('Submission not found.', 404);
    const row = (await database.query(detailSql, [id, account.id])).rows[0];
    if (!row) throw new AccountError('Submission not found.', 404);
    return row;
  }
  async function mutate(account, body, id) {
    const draft = submissionDraft(body, { correction: !!id });
    if (id && !uuidPattern.test(id)) throw new AccountError('Submission not found.', 404);
    const operation = id ? `submission.correct:${id}` : 'submission.create';
    const client = await database.connect(),
      written = [];
    let commitAttempted = false;
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [account.id]);
      const prior = (
        await client.query(
          'SELECT request_digest,response_body FROM write_requests WHERE account_id=$1 AND operation=$2 AND request_key=$3',
          [account.id, operation, draft.requestKey],
        )
      ).rows[0];
      if (prior) {
        if (prior.request_digest !== draft.digest)
          throw new AccountError('This request key belongs to another submission change.', 409);
        commitAttempted = true;
        await client.query('COMMIT');
        return prior.response_body;
      }
      let previous;
      if (id) {
        previous = (
          await client.query('SELECT * FROM submissions WHERE id=$1 AND account_id=$2 FOR UPDATE', [
            id,
            account.id,
          ])
        ).rows[0];
        if (!previous) throw new AccountError('Submission not found.', 404);
        if (previous.status !== 'needs-review' || previous.revision !== draft.revision)
          throw new AccountError('Reload this submission before correcting it.', 409);
        if (previous.gtin14 !== draft.barcode.gtin14)
          throw new AccountError('A correction must keep the same product barcode.');
      } else {
        const known = await client.query(
          "SELECT id FROM foods WHERE catalog_active=true AND provenance <> 'synthetic' AND id IN (SELECT food_id FROM food_barcodes WHERE gtin14=$1)",
          [draft.barcode.gtin14],
        );
        if (known.rows.length)
          throw new AccountError(
            'This product is already in the catalog. Scan or search it to log a serving.',
            409,
          );
        const duplicate = await client.query(
          "SELECT id FROM submissions WHERE account_id=$1 AND gtin14=$2 AND status IN ('pending','needs-review')",
          [account.id, draft.barcode.gtin14],
        );
        if (duplicate.rows.length)
          throw new AccountError(
            'You already have a pending submission for this product. Open My submissions.',
            409,
          );
      }
      const submissionId = id || randomUUID();
      const keys = {},
        media = {};
      for (const kind of ['front', 'label']) {
        if (draft[kind]) {
          keys[kind] = await photos.save(account.id, submissionId, draft[kind]);
          written.push(keys[kind]);
          media[kind] = {
            mime: draft[kind].mime,
            size: draft[kind].size,
            sha256: draft[kind].sha256,
          };
        } else {
          keys[kind] = previous[`${kind}_image_key`];
          media[kind] = previous.product.media[kind];
        }
      }
      const product = { ...draft.product, media };
      const saved = id
        ? await client.query(
            `UPDATE submissions SET product=$1::jsonb,front_image_key=$2,label_image_key=$3,status='pending',revision=revision+1
        WHERE id=$4 AND account_id=$5 RETURNING *`,
            [JSON.stringify(product), keys.front, keys.label, id, account.id],
          )
        : await client.query(
            `INSERT INTO submissions (id,account_id,gtin14,front_image_key,label_image_key,product)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
            [
              submissionId,
              account.id,
              draft.barcode.gtin14,
              keys.front,
              keys.label,
              JSON.stringify(product),
            ],
          );
      const response = { submission: publicSubmission(saved.rows[0]) };
      await client.query(
        `INSERT INTO write_requests (account_id,operation,request_key,request_digest,response_status,response_body)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
        [
          account.id,
          operation,
          draft.requestKey,
          draft.digest,
          id ? 200 : 201,
          JSON.stringify(response),
        ],
      );
      commitAttempted = true;
      await client.query('COMMIT');
      return response;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      // An uncertain COMMIT retains new private files for inspection: removing
      // them could break an operation that actually committed before disconnect.
      if (!commitAttempted) await photos.discard(written);
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    async list(account) {
      return {
        submissions: (
          await database.query(
            `${detailSql.replace('WHERE s.id=$1 AND s.account_id=$2', 'WHERE s.account_id=$1')} ORDER BY s.created_at DESC,s.id DESC LIMIT 50`,
            [account.id],
          )
        ).rows.map(publicSubmission),
      };
    },
    async get(account, id) {
      return { submission: publicSubmission(await owned(account, id)) };
    },
    async photo(account, id, kind) {
      if (!['front', 'label'].includes(kind)) throw new AccountError('Photo not found.', 404);
      const row = await owned(account, id);
      return {
        bytes: await photos.read(row[`${kind}_image_key`]),
        mime: row.product.media[kind].mime,
      };
    },
    create: (account, body) => mutate(account, body),
    correct: (account, id, body) => mutate(account, body, id),
  };
}
