import { randomUUID } from 'node:crypto';
import { AccountError } from '../auth/service.js';

function publicAccount(row) {
  return (
    row && { id: row.id, displayName: row.display_name, timeZone: row.time_zone, sharing: false }
  );
}

export function hostedAccountRepository(database) {
  return {
    async find(identity) {
      const result = await database.query(
        'SELECT a.id, a.display_name, a.time_zone FROM accounts a JOIN hosted_account_profiles p ON p.account_id = a.id WHERE a.identity_issuer = $1 AND a.identity_subject = $2 AND p.adult_confirmed = true',
        [identity.issuer, identity.subject],
      );
      return publicAccount(result.rows[0]) ?? null;
    },
    async onboard(identity, body) {
      if (
        !body ||
        Object.keys(body).sort().join(',') !== 'adult,displayName,timeZone' ||
        body.adult !== true ||
        typeof body.displayName !== 'string' ||
        !body.displayName.trim() ||
        body.displayName.trim().length > 80 ||
        typeof body.timeZone !== 'string' ||
        body.timeZone.length > 100
      )
        throw new AccountError('Confirm adult eligibility, display name and timezone.');
      try {
        new Intl.DateTimeFormat('en', { timeZone: body.timeZone });
      } catch {
        throw new AccountError('Choose a valid timezone.');
      }
      const client = await database.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          'INSERT INTO accounts (id, identity_issuer, identity_subject, display_name, time_zone) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (identity_issuer, identity_subject) DO UPDATE SET identity_subject = EXCLUDED.identity_subject RETURNING id, display_name, time_zone',
          [randomUUID(), identity.issuer, identity.subject, body.displayName.trim(), body.timeZone],
        );
        await client.query(
          'INSERT INTO hosted_account_profiles (account_id, adult_confirmed) VALUES ($1, true) ON CONFLICT (account_id) DO NOTHING',
          [result.rows[0].id],
        );
        await client.query('COMMIT');
        return publicAccount(result.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
