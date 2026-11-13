import { build } from '../Frontend/node_modules/rolldown/dist/index.mjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Local packaging smoke check using Vite's installed bundler, not a Netlify deploy.
const output = resolve('.netlify/check/api.mjs');
await build({
  input: 'netlify/functions/api.mjs',
  platform: 'node',
  external: ['pg-native'],
  output: { file: output, format: 'esm' },
});
const { default: handler } = await import(pathToFileURL(output).href);
const response = await handler(new Request('https://example.test/api/health'));
if (response.status !== 200 || (await response.json()).status !== 'ok')
  throw new Error('Bundled API health check failed.');
console.info('Bundled hosted API health check passed without database credentials.');
