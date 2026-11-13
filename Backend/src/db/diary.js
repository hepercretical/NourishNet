import { createHash, randomUUID } from 'node:crypto';
import { AccountError } from '../auth/service.js';
import { localDate, nutritionAmount } from './validation.js';
import { diaryMutations } from './diaryMutations.js';

const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
const columns = {
  calories: 'calories_kcal',
  protein: 'protein_g',
  fat: 'fat_g',
  carbohydrates: 'carbohydrates_g',
  sodium: 'sodium_mg',
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Both database domains have four decimal places. Integer arithmetic preserves
// all eight product places through meal/day aggregation; display may round later.
function fixed(value) {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'));
}
function contribution(row, column) {
  return row[column] === null ? null : fixed(row[column]) * fixed(row.quantity);
}
function totals(rows) {
  return Object.fromEntries(
    Object.entries(columns).map(([name, column]) => {
      const values = rows.map((row) => contribution(row, column));
      return [
        name,
        values.includes(null) ? null : Number(values.reduce((a, b) => a + b, 0n)) / 1e8,
      ];
    }),
  );
}
function entry(row) {
  return {
    id: row.id,
    revision: row.revision ?? 1,
    servingId: row.source_serving_id,
    catalogVersion: row.catalog_version,
    meal: row.meal,
    quantity: Number(row.quantity),
    foodName: row.food_name,
    servingBasis: row.serving_label,
    grams: row.serving_grams === null ? null : Number(row.serving_grams),
    nutrients: Object.fromEntries(
      Object.entries(columns).map(([name, column]) => [
        name,
        row[column] === null ? null : Number(row[column]),
      ]),
    ),
    contribution: totals([row]),
  };
}
export function diaryDraft(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).sort().join(',') !== 'date,meal,quantity,requestKey,servingId'
  )
    throw new AccountError('Send the date, serving, quantity, meal, and request key.');
  try {
    localDate(body.date);
    nutritionAmount(body.quantity, { positive: true });
  } catch {
    throw new AccountError(
      'Use a real local date and a positive quantity with at most four decimal places.',
    );
  }
  if (
    !meals.includes(body.meal) ||
    typeof body.servingId !== 'string' ||
    typeof body.requestKey !== 'string' ||
    !uuid.test(body.servingId) ||
    !uuid.test(body.requestKey)
  )
    throw new AccountError('Choose a serving and meal, then try saving again.');
  return {
    ...body,
    servingId: body.servingId.toLowerCase(),
    requestKey: body.requestKey.toLowerCase(),
  };
}

export function diaryRepository(database) {
  return {
    ...diaryMutations(database, entry),
    async get(account, date) {
      try {
        localDate(date);
      } catch {
        throw new AccountError('Use a real local date in YYYY-MM-DD format.');
      }
      // A single statement gives one consistent snapshot, including an empty day.
      const result = await database.query(
        `SELECT d.time_zone, e.* FROM diary_days d
         LEFT JOIN diary_entries e ON e.day_id = d.id
         WHERE d.account_id = $1 AND d.local_date = $2::date
         ORDER BY e.created_at, e.id`,
        [account.id, date],
      );
      const rows = result.rows.filter((row) => row.id !== null);
      return {
        date,
        timeZone: result.rows[0]?.time_zone ?? account.timeZone,
        totals: totals(rows),
        meals: meals.map((meal) => {
          const selected = rows.filter((row) => row.meal === meal);
          return { name: meal, entries: selected.map(entry), totals: totals(selected) };
        }),
      };
    },
    async create(account, input) {
      const draft = diaryDraft(input);
      const digest = createHash('sha256')
        .update(JSON.stringify([draft.date, draft.servingId, draft.quantity, draft.meal]))
        .digest('hex');
      const client = await database.connect();
      try {
        await client.query('BEGIN');
        // Serialize actor writes across processes so concurrent retries replay once.
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [account.id]);
        const prior = await client.query(
          `SELECT request_digest, response_body FROM write_requests
           WHERE account_id = $1 AND operation = 'diary.create' AND request_key = $2`,
          [account.id, draft.requestKey],
        );
        if (prior.rows.length) {
          if (prior.rows[0].request_digest !== digest)
            throw new AccountError('This save key was already used for a different entry.', 409);
          await client.query('COMMIT');
          return prior.rows[0].response_body;
        }
        const catalog = await client.query(
          `SELECT f.name, f.version, s.* FROM food_servings s
           JOIN foods f ON f.id = s.food_id WHERE s.id = $1
           AND f.catalog_active = true AND f.provenance <> 'synthetic' FOR SHARE OF f, s`,
          [draft.servingId],
        );
        const food = catalog.rows[0];
        if (!food)
          throw new AccountError('This serving is unavailable. Search for the food again.', 404);
        const day = await client.query(
          `INSERT INTO diary_days (id, account_id, local_date, time_zone)
           VALUES ($1, $2, $3::date, $4)
           ON CONFLICT (account_id, local_date) DO UPDATE SET revision = diary_days.revision + 1
           RETURNING id`,
          [randomUUID(), account.id, draft.date, account.timeZone],
        );
        const saved = await client.query(
          `INSERT INTO diary_entries (id, day_id, source_serving_id, catalog_version, meal,
           quantity, food_name, serving_label, serving_grams, calories_kcal, protein_g,
           fat_g, carbohydrates_g, sodium_mg)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
          [
            randomUUID(),
            day.rows[0].id,
            draft.servingId,
            food.version,
            draft.meal,
            draft.quantity,
            food.name,
            food.label,
            food.grams,
            food.calories_kcal,
            food.protein_g,
            food.fat_g,
            food.carbohydrates_g,
            food.sodium_mg,
          ],
        );
        const body = { date: draft.date, entry: entry(saved.rows[0]) };
        await client.query(
          `INSERT INTO write_requests (account_id, operation, request_key, request_digest,
           response_status, response_body) VALUES ($1, 'diary.create', $2, $3, 201, $4::jsonb)`,
          [account.id, draft.requestKey, digest, JSON.stringify(body)],
        );
        await client.query('COMMIT');
        return body;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
