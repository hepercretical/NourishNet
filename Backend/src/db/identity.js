import { identityPart } from './validation.js';

// Called only after the future approved auth adapter verifies a session.
// This lookup does not authenticate a caller or accept browser ownership IDs.
export function identityRepository(database) {
  return {
    async findAccount(verifiedIdentity) {
      const issuer = identityPart(verifiedIdentity?.issuer);
      const subject = identityPart(verifiedIdentity?.subject);
      const result = await database.query(
        'SELECT id FROM accounts WHERE identity_issuer = $1 AND identity_subject = $2',
        [issuer, subject],
      );
      return result.rows[0]?.id ?? null;
    },
  };
}
