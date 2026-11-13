import { createHash, randomUUID } from 'node:crypto';
import { AccountError } from '../auth/service.js';
import { hashPassword, verifyPassword } from '../auth/credentials.js';
import { localDate, nutritionAmount } from './validation.js';
import { estimateEnergy, formulaVersion, localToday, streaks } from '../../../shared/personal.js';

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const fail = (message = 'Check your entries and try again.', status = 400) => {
  throw new AccountError(message, status);
};
function exact(value, keys) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== keys.sort().join()
  )
    fail();
}
function amount(value, positive = false) {
  try {
    return nutritionAmount(value, { positive });
  } catch {
    fail('Enter a valid amount with at most four decimal places.');
  }
}
function date(value) {
  try {
    return localDate(value);
  } catch {
    fail('Choose a real local date.');
  }
}
function identifier(value, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || !uuid.test(value)) fail();
}
export function validateGoal(body, today) {
  exact(body, [
    'effectiveDate',
    'calories',
    'mode',
    'macroMode',
    'macros',
    'provenance',
    'currentVersion',
    'requestKey',
  ]);
  date(body.effectiveDate);
  if (body.effectiveDate < today) fail('Goals start today or on a future date.');
  amount(body.calories, true);
  identifier(body.currentVersion, true);
  identifier(body.requestKey);
  if (
    !['deficit', 'surplus', 'maintain'].includes(body.mode) ||
    !['grams', 'percent'].includes(body.macroMode)
  )
    fail();
  if (body.macros !== null) {
    exact(body.macros, ['protein', 'carbohydrates', 'fat']);
    for (const value of Object.values(body.macros)) {
      amount(value);
      if (body.macroMode === 'percent' && value > 100) fail('Percent goals must total 100.');
    }
    if (
      body.macroMode === 'percent' &&
      Object.values(body.macros).reduce((s, v) => s + Math.round(v * 10000), 0) !== 1000000
    )
      fail('Percent goals must total 100.');
  }
  if (body.provenance?.kind === 'manual') exact(body.provenance, ['kind']);
  else {
    exact(body.provenance, ['kind', 'version', 'inputs', 'baseline']);
    exact(body.provenance.inputs, [
      'sex',
      'activity',
      'age',
      'height',
      'weight',
      'heightUnit',
      'weightUnit',
    ]);
    if (
      body.provenance.kind !== 'estimate' ||
      body.provenance.version !== formulaVersion ||
      estimateEnergy(body.provenance.inputs) !== body.provenance.baseline ||
      body.provenance.baseline === null
    )
      fail('Review the estimate again.');
  }
  return body;
}
function goal(row) {
  return row
    ? {
        id: row.id,
        effectiveDate: String(row.effective_date).slice(0, 10),
        calories: Number(row.calories),
        mode: row.mode,
        macroMode: row.macro_mode,
        macros: row.macros && Object.keys(row.macros).length ? row.macros : null,
        provenance: row.provenance,
      }
    : null;
}
function weight(row) {
  return row
    ? {
        id: row.id,
        date: String(row.local_date).slice(0, 10),
        kg: Number(row.weight_kg),
        removed: row.removed,
      }
    : null;
}
export function personalRepository(database) {
  async function transaction(work) {
    const c = await database.connect();
    try {
      await c.query('BEGIN');
      const r = await work(c);
      await c.query('COMMIT');
      return r;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  }
  async function write(account, operation, body, work) {
    identifier(body.requestKey);
    const digest = createHash('sha256').update(JSON.stringify(body)).digest('hex');
    return transaction(async (c) => {
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [account.id]);
      const prior = (
        await c.query(
          'SELECT request_digest,response_body FROM write_requests WHERE account_id=$1 AND operation=$2 AND request_key=$3',
          [account.id, operation, body.requestKey],
        )
      ).rows[0];
      if (prior) {
        if (prior.request_digest !== digest)
          fail('This save key was already used for different values.', 409);
        return prior.response_body;
      }
      const result = await work(c);
      await c.query(
        'INSERT INTO write_requests(account_id,operation,request_key,request_digest,response_status,response_body) VALUES($1,$2,$3,$4,200,$5::jsonb)',
        [account.id, operation, body.requestKey, digest, JSON.stringify(result)],
      );
      return result;
    });
  }
  async function getGoals(c, account) {
    return (
      await c.query(
        'SELECT g.*,g.effective_date::text FROM personal_goal_versions g WHERE g.account_id=$1 ORDER BY g.effective_date,g.created_at,g.id LIMIT 10001',
        [account.id],
      )
    ).rows.map(goal);
  }
  return {
    async getGoal(account, when) {
      date(when);
      const row = (
        await database.query(
          'SELECT g.*,g.effective_date::text FROM personal_goal_versions g WHERE g.account_id=$1 AND g.effective_date <= $2::date ORDER BY g.effective_date DESC,g.created_at DESC,g.id DESC LIMIT 1',
          [account.id, when],
        )
      ).rows[0];
      return { goal: goal(row) };
    },
    async saveGoal(account, body) {
      validateGoal(body, localToday(account.timeZone));
      return write(account, 'personal.goal', body, async (c) => {
        const previous = (
          await c.query(
            'SELECT id FROM personal_goal_versions WHERE account_id=$1 AND effective_date=$2::date ORDER BY created_at DESC,id DESC LIMIT 1',
            [account.id, body.effectiveDate],
          )
        ).rows[0];
        if ((previous?.id ?? null) !== body.currentVersion)
          fail('This date already has a newer goal. Reload and review before replacing it.', 409);
        const row = (
          await c.query(
            `INSERT INTO personal_goal_versions(id,account_id,effective_date,calories,mode,macro_mode,macros,provenance,created_at)
          VALUES($1,$2,$3::date,$4,$5,$6,$7::jsonb,$8::jsonb,clock_timestamp()) RETURNING *,effective_date::text`,
            [
              randomUUID(),
              account.id,
              body.effectiveDate,
              body.calories,
              body.mode,
              body.macroMode,
              JSON.stringify(body.macros ?? {}),
              JSON.stringify(body.provenance),
            ],
          )
        ).rows[0];
        return { goal: goal(row) };
      });
    },
    async stats(account, from, to) {
      date(from);
      date(to);
      if (from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > 365)
        fail('Choose an interval of at most 366 days.');
      return transaction(async (c) => {
        await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const rows = (
          await c.query(
            `SELECT d.local_date::text AS date,count(e.id)::int AS count,
          sum(e.calories_kcal*e.quantity)::text AS calories FROM diary_days d
          JOIN diary_entries e ON e.day_id=d.id WHERE d.account_id=$1 AND d.local_date <= $2::date
          GROUP BY d.local_date ORDER BY d.local_date LIMIT 10001`,
            [account.id, localToday(account.timeZone)],
          )
        ).rows;
        const goals = await getGoals(c, account);
        if (rows.length > 10000 || goals.length > 10000)
          fail(
            'This history needs a paginated review. Choose a smaller export with your developer.',
          );
        const days = rows.map((r) => ({
          ...r,
          calories: r.calories === null ? null : Number(r.calories),
        }));
        return {
          days: days.filter((d) => d.date >= from && d.date <= to),
          goals,
          streaks: streaks(days, goals, localToday(account.timeZone)),
        };
      });
    },
    async weights(account, from, to) {
      date(from);
      date(to);
      if (from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > 3660)
        fail('Choose a weight interval of at most ten years.');
      const rows = (
        await database.query(
          `SELECT * FROM (SELECT DISTINCT ON(local_date) *,local_date::text AS date
        FROM personal_weight_versions WHERE account_id=$1 AND local_date BETWEEN $2::date AND $3::date
        ORDER BY local_date,created_at DESC,id DESC) w WHERE NOT removed ORDER BY date LIMIT 3661`,
          [account.id, from, to],
        )
      ).rows;
      const earliest = (
        await database.query(
          'SELECT min(local_date)::text AS date FROM personal_weight_versions WHERE account_id=$1',
          [account.id],
        )
      ).rows[0].date;
      return { weights: rows.map((r) => weight({ ...r, local_date: r.date })), earliest };
    },
    async saveWeight(account, body) {
      exact(body, ['date', 'weight', 'unit', 'currentVersion', 'removed', 'requestKey']);
      date(body.date);
      if (body.date > localToday(account.timeZone)) fail('Weight entries cannot be in the future.');
      amount(body.weight, true);
      identifier(body.currentVersion, true);
      if (!['kg', 'lb'].includes(body.unit) || typeof body.removed !== 'boolean') fail();
      const kg = Number((body.weight * (body.unit === 'lb' ? 0.45359237 : 1)).toFixed(4));
      amount(kg, true);
      return write(account, 'personal.weight', body, async (c) => {
        const previous = (
          await c.query(
            'SELECT id,removed FROM personal_weight_versions WHERE account_id=$1 AND local_date=$2::date ORDER BY created_at DESC,id DESC LIMIT 1',
            [account.id, body.date],
          )
        ).rows[0];
        if (
          (previous && !previous.removed ? previous.id : null) !== body.currentVersion ||
          (body.removed && (!previous || previous.removed))
        )
          fail('Reload this date before changing its measurement.', 409);
        const row = (
          await c.query(
            'INSERT INTO personal_weight_versions(id,account_id,local_date,weight_kg,removed,created_at) VALUES($1,$2,$3::date,$4,$5,clock_timestamp()) RETURNING *,local_date::text',
            [randomUUID(), account.id, body.date, kg, body.removed],
          )
        ).rows[0];
        return { weight: weight(row) };
      });
    },
    async appearance(account) {
      const r = (
        await database.query(
          'SELECT mode,accent,revision FROM personal_appearance WHERE account_id=$1',
          [account.id],
        )
      ).rows[0];
      return r ?? { mode: 'light', accent: 'green', revision: 0 };
    },
    async saveAppearance(account, body) {
      exact(body, ['mode', 'accent', 'revision', 'requestKey']);
      if (
        !['light', 'dark'].includes(body.mode) ||
        !['green', 'blue', 'purple', 'red'].includes(body.accent) ||
        !Number.isInteger(body.revision) ||
        body.revision < 0
      )
        fail();
      return write(account, 'personal.appearance', body, async (c) => {
        const prior = (
          await c.query('SELECT revision FROM personal_appearance WHERE account_id=$1 FOR UPDATE', [
            account.id,
          ])
        ).rows[0];
        if ((prior?.revision ?? 0) !== body.revision)
          fail('Appearance changed elsewhere. Reload before saving.', 409);
        return (
          await c.query(
            'INSERT INTO personal_appearance(account_id,mode,accent,revision) VALUES($1,$2,$3,1) ON CONFLICT(account_id) DO UPDATE SET mode=$2,accent=$3,revision=personal_appearance.revision+1 RETURNING mode,accent,revision',
            [account.id, body.mode, body.accent],
          )
        ).rows[0];
      });
    },
    async profile(account, body) {
      exact(body, ['displayName', 'timeZone', 'previousName', 'previousTimeZone', 'requestKey']);
      if (
        typeof body.displayName !== 'string' ||
        !body.displayName.trim() ||
        body.displayName.length > 100 ||
        typeof body.timeZone !== 'string' ||
        body.timeZone.length > 100
      )
        fail();
      try {
        new Intl.DateTimeFormat('en', { timeZone: body.timeZone });
      } catch {
        fail('Choose a valid time zone.');
      }
      return write(account, 'personal.profile', body, async (c) => {
        const result = await c.query(
          'UPDATE accounts SET display_name=$2,time_zone=$3 WHERE id=$1 AND display_name=$4 AND time_zone=$5 RETURNING id,display_name,time_zone',
          [
            account.id,
            body.displayName.trim(),
            body.timeZone,
            body.previousName,
            body.previousTimeZone,
          ],
        );
        if (!result.rows.length) fail('Your profile changed. Reload before saving.', 409);
        return { saved: true };
      });
    },
    async password(account, body) {
      exact(body, ['currentPassword', 'newPassword']);
      if (
        typeof body.currentPassword !== 'string' ||
        body.currentPassword.length > 128 ||
        typeof body.newPassword !== 'string' ||
        body.newPassword.length < 15 ||
        body.newPassword.length > 128 ||
        body.currentPassword === body.newPassword
      )
        fail('Use a different password with 15 to 128 characters.');
      return transaction(async (c) => {
        const r = (
          await c.query(
            'SELECT password_hash FROM account_credentials WHERE account_id=$1 FOR UPDATE',
            [account.id],
          )
        ).rows[0];
        if (!r || !(await verifyPassword(body.currentPassword, r.password_hash)))
          fail('Your current password is incorrect.');
        await c.query('UPDATE account_credentials SET password_hash=$2 WHERE account_id=$1', [
          account.id,
          await hashPassword(body.newPassword),
        ]);
        await c.query(
          'UPDATE account_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',
          [account.id],
        );
        return { saved: true };
      });
    },
  };
}
