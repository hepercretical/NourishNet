import { personalRepository } from '../db/personal.js';
import { createDatabase } from '../db/client.js';
import { requireSyntheticDevelopment } from '../db/config.js';
import { accountRepository } from '../db/accounts.js';
import { foodRepository } from '../db/foods.js';
import { diaryRepository } from '../db/diary.js';
import { createAuthService } from '../auth/service.js';
import { deliverLocalMessage } from '../auth/outbox.js';
import { submissionRepository } from '../db/submissions.js';
import { localPhotoStore } from './localPhotos.js';

export function localServices(env = process.env) {
  requireSyntheticDevelopment(env);
  if (
    env.DATABASE_EXPECTED_HOST !== '127.0.0.1' ||
    env.DATABASE_EXPECTED_NAME !== 'nourishnet_plan02_dev'
  )
    throw new Error('Only the approved loopback synthetic target is supported.');
  const database = createDatabase(env);
  const personal = personalRepository(database);
  const diary = diaryRepository(database);
  return {
    auth: createAuthService({
      repository: accountRepository(database),
      deliver: deliverLocalMessage,
    }),
    personal,
    foods: foodRepository(database),
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
    submissions: submissionRepository(database, localPhotoStore()),
    close: () => database.end(),
  };
}
