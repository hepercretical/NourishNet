import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const id = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const keyPattern = new RegExp(`^${id}/${id}/${id}\\.(?:jpg|png|webp)$`);
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export function localPhotoStore(
  root = fileURLToPath(new URL('../../uploads/submissions/', import.meta.url)),
) {
  const base = resolve(root);
  function path(key) {
    if (!keyPattern.test(key)) throw new Error('Invalid stored photo reference.');
    const result = resolve(base, ...key.split('/'));
    if (!result.startsWith(base + sep)) throw new Error('Invalid stored photo reference.');
    return result;
  }
  return {
    async save(accountId, submissionId, photo) {
      const key = `${accountId}/${submissionId}/${randomUUID()}.${extensions[photo.mime]}`;
      const target = path(key);
      await mkdir(dirname(target), { recursive: true });
      try {
        await writeFile(target, photo.bytes, { flag: 'wx', mode: 0o600 });
      } catch (error) {
        if (error.code !== 'EEXIST') await unlink(target).catch(() => {});
        throw error;
      }
      return key;
    },
    async read(key) {
      return readFile(path(key));
    },
    async discard(keys) {
      for (const key of keys) await unlink(path(key)).catch(() => {});
    },
  };
}
