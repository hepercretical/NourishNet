import { Pool } from 'pg';
import { databaseConfig } from './config.js';

// Importing this module neither reads credentials nor opens a connection.
export function createDatabase(env = process.env) {
  const pool = new Pool(databaseConfig(env));
  // A disconnected idle client must not emit secrets or crash the HTTP process.
  pool.on('error', () => {});
  return pool;
}
