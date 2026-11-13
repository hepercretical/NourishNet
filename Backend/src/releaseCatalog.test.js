import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/neon-catalog.js', import.meta.url));
it.each(['localhost', 'example.test', 'ep-example-pooler.neon.tech'])(
  'rejects an unapproved or pooled catalog target before reading credentials: %s',
  (host) => {
    const result = spawnSync(
      process.execPath,
      [
        script,
        'missing-private-environment.env',
        host,
        'fairlife-nutrition-plan-chocolate.json',
        'not-approved',
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Hosted catalog release stopped');
    expect(result.stdout).toBe('');
  },
);
it('rejects an unreviewed checksum without loading credentials or connecting', () => {
  const result = spawnSync(
    process.execPath,
    [
      script,
      'missing-private-environment.env',
      'ep-test.neon.tech',
      'fairlife-nutrition-plan-chocolate.json',
      'wrong-checksum',
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('checksum');
  expect(result.stdout).toBe('');
});
