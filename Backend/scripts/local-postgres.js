import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

// Portable, loopback-only development cluster. No Windows service or hosted DB.
const root = new URL('../../.tools/postgresql/', import.meta.url);
const data = fileURLToPath(new URL('data', root));
const bin = new URL('pgsql/bin/', root);
const envFile = new URL('../.env', import.meta.url);
const passwordFile = new URL('init-password', root);
const databaseName = 'nourishnet_plan02_dev';
const action = process.argv[2];

function run(name, args) {
  const outcome = spawnSync(fileURLToPath(new URL(`${name}.exe`, bin)), args, {
    windowsHide: true,
    stdio: 'ignore',
    encoding: 'utf8',
    timeout: 60000,
  });
  if (outcome.error || outcome.status !== 0) {
    writeFileSync(
      new URL('setup.log', root),
      `${outcome.error?.code ?? ''}\n${outcome.stdout ?? ''}\n${outcome.stderr ?? ''}`,
    );
    throw new Error('Local PostgreSQL command failed. Check the ignored local PostgreSQL log.');
  }
}

try {
  if (!['init', 'start', 'stop'].includes(action)) throw new Error('Use init, start, or stop.');
  if (action === 'init') {
    if (existsSync(data) || existsSync(envFile)) {
      throw new Error('Local setup already exists; no files were overwritten.');
    }
    const password = existsSync(passwordFile)
      ? readFileSync(passwordFile, 'utf8')
      : randomBytes(32).toString('hex');
    if (!existsSync(passwordFile)) {
      writeFileSync(passwordFile, password, { flag: 'wx', mode: 0o600 });
    }
    run('initdb', [
      '-D',
      data,
      '-U',
      'nourishnet_local_admin',
      '--encoding=UTF8',
      '--no-locale',
      '--auth=scram-sha-256',
      `--pwfile=${fileURLToPath(passwordFile)}`,
    ]);
    writeFileSync(
      new URL('data/postgresql.auto.conf', root),
      "listen_addresses = '127.0.0.1'\nport = 55432\nlog_statement = 'none'\nlog_min_error_statement = 'panic'\n",
      { flag: 'a' },
    );
    writeFileSync(
      envFile,
      `HOST=127.0.0.1\nPORT=3001\nDATABASE_ENV=development\nDATABASE_SYNTHETIC_ONLY=true\nDATABASE_EXPECTED_HOST=127.0.0.1\nDATABASE_EXPECTED_NAME=${databaseName}\nDATABASE_URL=postgresql://nourishnet_local_admin:${password}@127.0.0.1:55432/${databaseName}\n`,
      { flag: 'wx', mode: 0o600 },
    );
    console.info(
      'Local cluster initialized. Backend/.env contains ignored development credentials.',
    );
  } else if (action === 'start') {
    if (!existsSync(envFile) || !existsSync(data))
      throw new Error('Initialize the local cluster first.');
    const status = spawnSync(fileURLToPath(new URL('pg_ctl.exe', bin)), ['-D', data, 'status'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    if (status.status !== 0) {
      run('pg_ctl', [
        '-D',
        data,
        '-l',
        fileURLToPath(new URL('postgres.log', root)),
        '-w',
        'start',
      ]);
    }
    const client = new Client({
      host: '127.0.0.1',
      port: 55432,
      database: 'postgres',
      user: 'nourishnet_local_admin',
      password: readFileSync(passwordFile, 'utf8'),
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      const found = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [
        databaseName,
      ]);
      if (!found.rows.length) await client.query('CREATE DATABASE nourishnet_plan02_dev');
    } finally {
      await client.end();
    }
    console.info('Local development PostgreSQL is running on loopback port 55432.');
  } else {
    run('pg_ctl', ['-D', data, '-w', 'stop']);
    console.info('Local development PostgreSQL stopped.');
  }
} catch (error) {
  // Messages here are fixed local setup text; never print driver/child diagnostics.
  console.error(
    error instanceof Error && error.message.startsWith('Local')
      ? error.message
      : 'Local PostgreSQL setup failed. Check prerequisites; existing files were preserved.',
  );
  process.exitCode = 1;
}
