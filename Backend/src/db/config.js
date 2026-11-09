const environments = ['development', 'preview', 'production'];
const localHosts = ['127.0.0.1', 'localhost', '[::1]'];

export function databaseConfig(env = process.env) {
  const fail = () => {
    throw new Error('Database configuration is missing or invalid. Check backend settings.');
  };
  if (!environments.includes(env.DATABASE_ENV)) fail();
  let target;
  try {
    target = new URL(env.DATABASE_URL);
  } catch {
    fail();
  }
  if (!['postgres:', 'postgresql:'].includes(target.protocol)) fail();
  if (!target.username || !target.password || !target.hostname || !target.pathname.slice(1)) fail();
  if (target.hostname !== env.DATABASE_EXPECTED_HOST) fail();
  if (decodeURIComponent(target.pathname.slice(1)) !== env.DATABASE_EXPECTED_NAME) fail();
  if (target.hash) fail();
  // Use explicit TLS options, not URL parameters which can override them in pg.
  const allowed = new Set(['sslmode', 'channel_binding']);
  for (const key of target.searchParams.keys()) if (!allowed.has(key)) fail();
  const local = localHosts.includes(target.hostname);
  const mode = target.searchParams.get('sslmode');
  if (mode && !['require', 'verify-full'].includes(mode)) fail();
  target.search = '';
  return {
    connectionString: target.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    query_timeout: 12000,
    max: 5,
    enableChannelBinding: !local,
  };
}

export function requireSyntheticDevelopment(env = process.env) {
  if (env.DATABASE_ENV !== 'development' || env.DATABASE_SYNTHETIC_ONLY !== 'true') {
    throw new Error(
      'This command requires an explicitly confirmed synthetic development database.',
    );
  }
  return databaseConfig(env);
}
