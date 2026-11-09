import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function token() {
  return randomBytes(32).toString('base64url');
}

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, options);
  return `scrypt-v1:${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [version, salt, expected] = (stored || '').split(':');
  if (version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(expected))
    return false;
  const hash = await derive(password, salt, 64, options);
  return timingSafeEqual(hash, Buffer.from(expected, 'hex'));
}
