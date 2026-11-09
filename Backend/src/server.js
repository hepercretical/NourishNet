import { createApp } from './app.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exit(1);
}

const server = createApp();

server.on('error', () => {
  console.error('The local API could not start. Check HOST, PORT, and whether the port is in use.');
  process.exit(1);
});

server.listen(port, host, () => {
  console.info('NourishNet local API is running.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close());
}
