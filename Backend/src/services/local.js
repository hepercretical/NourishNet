import { createDatabase } from '../db/client.js';
import { requireSyntheticDevelopment } from '../db/config.js';
import { accountRepository } from '../db/accounts.js';
import { foodRepository } from '../db/foods.js';
import { createAuthService } from '../auth/service.js';
import { deliverLocalMessage } from '../auth/outbox.js';

export function localServices(env = process.env) {
  requireSyntheticDevelopment(env);
  if (
    env.DATABASE_EXPECTED_HOST !== '127.0.0.1' ||
    env.DATABASE_EXPECTED_NAME !== 'nourishnet_plan02_dev'
  )
    throw new Error('Only the approved loopback synthetic target is supported.');
  const database = createDatabase(env);
  return {
    auth: createAuthService({
      repository: accountRepository(database),
      deliver: deliverLocalMessage,
    }),
    foods: foodRepository(database),
    close: () => database.end(),
  };
}
