import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const directory = new URL('../../outbox/', import.meta.url);
export async function deliverLocalMessage(message) {
  // Never log codes, emails or the message body; this directory is Git-ignored.
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL(`${Date.now()}-${randomUUID()}.json`, directory),
    JSON.stringify(message, null, 2),
    { flag: 'wx', mode: 0o600 },
  );
}
