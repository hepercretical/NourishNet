// Isolated synthetic repository for unit/HTTP tests. It never connects to a database.
export function testRepository() {
  const accounts = new Map();
  const sessions = new Map();
  const tokens = new Map();
  return {
    accounts,
    sessions,
    tokens,
    async createAccount(record) {
      if (accounts.has(record.email)) return null;
      const account = {
        id: record.id,
        email: record.email,
        display_name: record.displayName,
        time_zone: record.timeZone,
        password_hash: record.passwordHash,
        verified_at: null,
      };
      accounts.set(record.email, account);
      return account;
    },
    async findByEmail(email) {
      return accounts.get(email) ?? null;
    },
    async issueToken(id, purpose, hash, expires) {
      for (const value of tokens.values())
        if (value.id === id && value.purpose === purpose) value.used = true;
      tokens.set(hash, { id, purpose, expires, used: false });
    },
    async consumeToken(email, purpose, hash, time, passwordHash) {
      const account = accounts.get(email);
      const value = tokens.get(hash);
      if (
        !account ||
        !value ||
        value.id !== account.id ||
        value.purpose !== purpose ||
        value.used ||
        value.expires <= time
      )
        return false;
      value.used = true;
      if (purpose === 'verify') account.verified_at = time;
      else {
        account.password_hash = passwordHash;
        for (const session of sessions.values())
          if (session.id === account.id) session.revoked = true;
      }
      return true;
    },
    async createSession(id, hash, expires) {
      sessions.set(hash, { id, expires });
    },
    async findSession(hash, time) {
      const value = sessions.get(hash);
      return value && !value.revoked && value.expires > time
        ? [...accounts.values()].find((account) => account.id === value.id)
        : null;
    },
    async revokeSession(hash) {
      const value = sessions.get(hash);
      if (value) value.revoked = true;
    },
  };
}
