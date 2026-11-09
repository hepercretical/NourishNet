export function handleHealth(request, response) {
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' });
    response.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  response.writeHead(200);
  response.end(JSON.stringify({ status: 'ok' }));
}
