import { createDatabase } from '../db/client.js';
import { requireSyntheticDevelopment } from '../db/config.js';
import { hostedAccountRepository } from '../db/hostedAccounts.js';
import { foodRepository } from '../db/foods.js';
import { diaryRepository } from '../db/diary.js';

export function hostedServices(env = process.env) {
  requireSyntheticDevelopment(env);
  if (!env.DATABASE_EXPECTED_HOST?.endsWith('.neon.tech'))
    throw new Error('Select the approved synthetic Neon database.');
  const database = createDatabase(env);
  return {
    accounts: hostedAccountRepository(database),
    foods: foodRepository(database),
    diary: diaryRepository(database),
    close: () => database.end(),
  };
}
