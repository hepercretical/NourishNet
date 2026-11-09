export function accountRepository(database) {
  async function transaction(work) {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    async createAccount({ id, email, displayName, timeZone, passwordHash }) {
      try {
        return await transaction(async (client) => {
          await client.query(
            'INSERT INTO accounts (id, identity_issuer, identity_subject, display_name, time_zone) VALUES ($1, $2, $3, $4, $5)',
            [id, 'nourishnet.local', id, displayName, timeZone],
          );
          await client.query(
            'INSERT INTO account_credentials (account_id, email, password_hash, adult_confirmed) VALUES ($1, $2, $3, true)',
            [id, email, passwordHash],
          );
          return { id, email, display_name: displayName, time_zone: timeZone };
        });
      } catch (error) {
        if (error.code === '23505') return null;
        throw error;
      }
    },
    async findByEmail(email) {
      return (
        (
          await database.query(
            'SELECT a.id, a.display_name, a.time_zone, c.email, c.password_hash, c.verified_at FROM accounts a JOIN account_credentials c ON c.account_id = a.id WHERE c.email = $1',
            [email],
          )
        ).rows[0] ?? null
      );
    },
    async issueToken(id, purpose, hash, expiry) {
      await transaction(async (client) => {
        await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [id]);
        await client.query(
          'UPDATE account_tokens SET used_at = now() WHERE account_id = $1 AND purpose = $2 AND used_at IS NULL',
          [id, purpose],
        );
        await client.query(
          'INSERT INTO account_tokens (token_hash, account_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
          [hash, id, purpose, expiry],
        );
      });
    },
    async consumeToken(email, purpose, hash, time, passwordHash) {
      return transaction(async (client) => {
        const account = (
          await client.query(
            'SELECT account_id FROM account_credentials WHERE email = $1 FOR UPDATE',
            [email],
          )
        ).rows[0];
        if (!account) return false;
        const result = await client.query(
          'UPDATE account_tokens SET used_at = $1 WHERE token_hash = $2 AND account_id = $3 AND purpose = $4 AND used_at IS NULL AND expires_at > $1 RETURNING account_id',
          [time, hash, account.account_id, purpose],
        );
        if (!result.rows.length) return false;
        if (purpose === 'verify')
          await client.query(
            'UPDATE account_credentials SET verified_at = $1 WHERE account_id = $2',
            [time, account.account_id],
          );
        else {
          await client.query(
            'UPDATE account_credentials SET password_hash = $1 WHERE account_id = $2',
            [passwordHash, account.account_id],
          );
          await client.query(
            'UPDATE account_sessions SET revoked_at = $1 WHERE account_id = $2 AND revoked_at IS NULL',
            [time, account.account_id],
          );
        }
        return true;
      });
    },
    async createSession(id, hash, expiry) {
      await database.query(
        'INSERT INTO account_sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)',
        [hash, id, expiry],
      );
    },
    async findSession(hash, time) {
      return (
        (
          await database.query(
            'SELECT a.id, a.display_name, a.time_zone FROM account_sessions s JOIN accounts a ON a.id = s.account_id JOIN account_credentials c ON c.account_id = a.id WHERE s.token_hash = $1 AND s.expires_at > $2 AND s.revoked_at IS NULL AND c.verified_at IS NOT NULL',
            [hash, time],
          )
        ).rows[0] ?? null
      );
    },
    async revokeSession(hash, time) {
      await database.query('UPDATE account_sessions SET revoked_at = $1 WHERE token_hash = $2', [
        time,
        hash,
      ]);
    },
  };
}
