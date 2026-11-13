import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';

// Explicit connection setup, not a build/deploy step. Never print values or CLI output.
const [file, cliEntry] = process.argv.slice(2);
const site = 'a91beb07-fd40-4ea5-a7f4-7e8c0fd92464';
const freeScopes = ['builds', 'functions', 'runtime', 'post_processing'];
try {
  if (!file || !cliEntry) throw new Error();
  const env = parseEnv(await readFile(file, 'utf8'));
  const db = new URL(env.DATABASE_URL);
  const auth = new URL(env.NEON_AUTH_BASE_URL);
  if (
    !db.hostname.endsWith('.neon.tech') ||
    !db.hostname.includes('-pooler') ||
    db.pathname !== '/neondb' ||
    auth.protocol !== 'https:'
  )
    throw new Error();
  const values = [
    ['DATABASE_URL', env.DATABASE_URL, 'functions', true],
    ['NEON_AUTH_BASE_URL', auth.href, 'functions'],
    ['DATABASE_EXPECTED_HOST', db.hostname, 'functions'],
    ['DATABASE_EXPECTED_NAME', 'neondb', 'functions'],
    ['DATABASE_ENV', 'development', 'functions'],
    ['DATABASE_SYNTHETIC_ONLY', 'true', 'functions'],
    ['APP_ORIGIN', 'https://thenourishnet.netlify.app', 'functions'],
    ['VITE_NEON_AUTH_URL', auth.href, 'builds'],
  ];
  function api(method, data) {
    const result = spawnSync(
      process.execPath,
      [cliEntry, 'api', method, '--data', JSON.stringify(data)],
      { encoding: 'utf8', windowsHide: true },
    );
    if (result.status !== 0) {
      const output = `${result.stdout || ''} ${result.stderr || ''}`;
      const labels = [
        'Forbidden',
        'Unauthorized',
        'upgrade',
        'plan',
        'scope',
        'secret',
        'Missing required',
        'not a valid api method',
      ];
      console.error(
        `Netlify ${method} failed (exit ${result.status}); diagnostic categories: ${labels.filter((label) => output.toLowerCase().includes(label.toLowerCase())).join(', ') || 'unclassified'}. Values withheld.`,
      );
      throw new Error();
    }
    return JSON.parse(result.stdout);
  }
  const target = api('getSite', { site_id: site });
  if (target.name !== 'thenourishnet') throw new Error();
  const params = { account_id: target.account_slug, site_id: site };
  const existing = api('getEnvVars', params);
  // Preserve existing configuration. Conflicts require a separate reviewed update.
  for (const [key] of values) if (existing.some((v) => v.key === key)) throw new Error();
  console.info('Target verified; creating only missing connection variables.');
  api('createEnvVars', {
    ...params,
    body: values.map(([key, value]) => ({
      key,
      scopes: freeScopes,
      values: [{ context: 'production', value }],
    })),
  });
  const saved = api('getEnvVars', params);
  for (const [key] of values) {
    const variable = saved.find((v) => v.key === key);
    if (
      !variable ||
      !freeScopes.every((scope) => variable.scopes.includes(scope)) ||
      !variable.values.some((v) => v.context === 'production')
    )
      throw new Error();
    console.info(`Verified ${key}: production/all scopes (Free); value hidden.`);
  }
} catch {
  console.error(
    'Connection setup failed. Verify the ignored input file and Netlify CLI entry path. Values were not printed.',
  );
  process.exitCode = 1;
}
