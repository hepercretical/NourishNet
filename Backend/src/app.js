import { personalRoutes } from './routes/personal.js';
import { createServer } from 'node:http';
import { handleHealth } from './routes/health.js';
import { accountRoutes } from './routes/accounts.js';
import { localServices } from './services/local.js';
import { submissionRoutes } from './routes/submissions.js';

export function createApp({ services, origin = 'http://127.0.0.1:5173' } = {}) {
  let active = services;
  const handleAccounts = accountRoutes({ getServices: () => (active ??= localServices()), origin });
  const handleSubmissions = submissionRoutes({
    getServices: () => (active ??= localServices()),
    origin,
  });
  const handlePersonal = personalRoutes({
    getServices: () => (active ??= localServices()),
    origin,
  });
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');

    // The request target is a path; no client-supplied host is needed for routing.
    const path = request.url.split('?')[0];
    if (path === '/api/health') {
      handleHealth(request, response);
      return;
    }

    if (await handleAccounts(request, response, new URL(request.url, 'http://localhost'))) return;
    if (await handleSubmissions(request, response, new URL(request.url, 'http://localhost')))
      return;

    if (await handlePersonal(request, response, new URL(request.url, 'http://localhost'))) return;

    response.writeHead(404);
    response.end(JSON.stringify({ error: 'Not found' }));
  });
  server.on('close', () => active?.close?.());
  return server;
}
