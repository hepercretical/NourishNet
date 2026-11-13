import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { expect, it, vi } from 'vitest';
import { localPhotoStore } from './localPhotos.js';
vi.mock('node:crypto', () => ({ randomUUID: () => 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }));
it('stores generated private keys and exact bytes while refusing traversal', async () => {
  const parent = resolve('../.tools');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(resolve(parent, 'photo-unit-'));
  if (!root.startsWith(parent + sep + 'photo-unit-'))
    throw new Error('Unsafe test cleanup target.');
  try {
    const store = localPhotoStore(root),
      bytes = Buffer.from([255, 216, 255]);
    const key = await store.save(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      { mime: 'image/jpeg', bytes },
    );
    expect(key).toMatch(/^[a-f0-9/-]+\.jpg$/);
    expect(await store.read(key)).toEqual(bytes);
    await expect(
      store.save('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', {
        mime: 'image/jpeg',
        bytes: Buffer.from('replacement'),
      }),
    ).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await store.read(key)).toEqual(bytes);
    await expect(store.read('../../.env')).rejects.toThrow('Invalid stored photo reference');
    await expect(store.save('../other', 'id', { mime: 'image/jpeg', bytes })).rejects.toThrow();
    await store.discard([key]);
    await expect(store.read(key)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
