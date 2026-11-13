import { loadEnvFile } from 'node:process';

// Explicit release command only; never invoked by builds or application startup.
const [file, expectedHost, action, name] = process.argv.slice(2);
try {
  if (
    !file ||
    !expectedHost?.endsWith('.neon.tech') ||
    expectedHost.includes('-pooler') ||
    !['check', 'migrate', 'seed'].includes(action)
  )
    throw new Error();
  loadEnvFile(file);
  const direct = new URL(process.env.DATABASE_URL_UNPOOLED);
  if (direct.hostname !== expectedHost || direct.pathname !== '/neondb') throw new Error();
  process.env.DATABASE_URL = direct.href;
  process.env.DATABASE_EXPECTED_HOST = expectedHost;
  process.env.DATABASE_EXPECTED_NAME = 'neondb';
  process.env.DATABASE_ENV = 'development';
  process.env.DATABASE_SYNTHETIC_ONLY = 'true';
  process.argv = [process.argv[0], process.argv[1], action, name];
  await import('./database.js');
} catch {
  console.error(
    'Neon database release failed. Verify the approved direct host, environment file and command.',
  );
  process.exitCode = 1;
}
