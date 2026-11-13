import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Only a public Auth endpoint goes into the browser build. DB credentials stay server-side.
try {
  const auth = new URL(process.env.VITE_NEON_AUTH_URL);
  if (auth.protocol !== 'https:' || auth.username || auth.password || auth.search || auth.hash)
    throw new Error();
} catch {
  console.error('Set VITE_NEON_AUTH_URL to the public HTTPS Auth endpoint before a hosted build.');
  process.exit(1);
}
const frontend = fileURLToPath(new URL('../Frontend/', import.meta.url));
const vite = fileURLToPath(new URL('../Frontend/node_modules/vite/bin/vite.js', import.meta.url));
const result = spawnSync(process.execPath, [vite, 'build'], {
  cwd: frontend,
  env: { ...process.env, VITE_AUTH_MODE: 'neon' },
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
