import { createDatabase } from '../db/client.js';
import { requireSyntheticDevelopment } from '../db/config.js';
import { hostedAccountRepository } from '../db/hostedAccounts.js';
import { foodRepository } from '../db/foods.js';
import { diaryRepository } from '../db/diary.js';
import { personalRepository } from '../db/personal.js';
import { submissionRepository } from '../db/submissions.js';
import { hostedPhotoStore } from './hostedPhotos.js';

export function hostedServices(env = process.env) {
  requireSyntheticDevelopment(env);
  if (!env.DATABASE_EXPECTED_HOST?.endsWith('.neon.tech'))
    throw new Error('Select the approved synthetic Neon database.');
  const database = createDatabase(env);
  const personal = personalRepository(database);
  const diary = diaryRepository(database);
  return {
    accounts: hostedAccountRepository(database),
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
