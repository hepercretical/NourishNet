import { createDatabase } from '../db/client.js';
import { requireSyntheticDevelopment } from '../db/config.js';
import { hostedAccountRepository } from '../db/hostedAccounts.js';
import { foodRepository } from '../db/foods.js';
import { diaryRepository } from '../db/diary.js';
import { personalRepository } from '../db/personal.js';
import { submissionRepository } from '../db/submissions.js';
import { hostedPhotoStore } from './hostedPhotos.js';
import { accountRepository } from '../db/accounts.js';
import { createAuthService } from '../auth/service.js';

export function hostedServices(env = process.env) {
  requireSyntheticDevelopment(env);
  if (!env.DATABASE_EXPECTED_HOST?.endsWith('.neon.tech'))
    throw new Error('Select the approved synthetic Neon database.');
  const database = createDatabase(env);
  const personal = personalRepository(database);
  const diary = diaryRepository(database);
  return {
    accounts: hostedAccountRepository(database),
    // Temporary guest support uses migration 006's existing private sessions.
    // Applying that migration remotely remains a separately approved release.
    guestAuth: createAuthService({
      repository: accountRepository(database),
      allowGuest: env.GUEST_TESTING_ENABLED === 'true',
    }),
    foods: foodRepository(database),
    personal,
    submissions: submissionRepository(database, hostedPhotoStore(database)),
    diary: {
      ...diary,
      async get(account, date) {
        const [day, saved] = await Promise.all([
          diary.get(account, date),
          personal.getGoal(account, date),
        ]);
        return { ...day, goal: saved.goal };
      },
    },
    close: () => database.end(),
  };
}
