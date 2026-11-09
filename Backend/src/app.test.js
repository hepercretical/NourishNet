import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

let server;
let baseUrl;

beforeAll(async () => {
  server = createApp();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

describe('local API', () => {
  it('reports a healthy process without needing a database', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('returns a useful JSON response for an unknown route', async () => {
    const response = await fetch(`${baseUrl}/api/missing`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'rejects %s to the read-only health endpoint',
    async (method) => {
      const response = await fetch(`${baseUrl}/api/health`, { method });
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET');
      expect(await response.json()).toEqual({ error: 'Method not allowed' });
    },
  );
});
