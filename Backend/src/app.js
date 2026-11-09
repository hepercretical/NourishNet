import { createServer } from 'node:http';
import { handleHealth } from './routes/health.js';

export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');

    // The request target is a path; no client-supplied host is needed for routing.
    const path = request.url.split('?')[0];
    if (path === '/api/health') {
      handleHealth(request, response);
      return;
    }

    response.writeHead(404);
    response.end(JSON.stringify({ error: 'Not found' }));
  });
}
