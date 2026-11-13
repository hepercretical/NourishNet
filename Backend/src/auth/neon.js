import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AccountError } from './service.js';

export function neonVerifier(env = process.env, keySet) {
  const base = new URL(env.NEON_AUTH_BASE_URL);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash)
    throw new Error('Configure the Neon Auth URL.');
  const jwks =
    keySet ?? createRemoteJWKSet(new URL(`${base.href.replace(/\/$/, '')}/.well-known/jwks.json`));
  return async (request) => {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AccountError('Sign in again.', 401);
    try {
      const { payload } = await jwtVerify(authorization.slice(7), jwks, {
        issuer: base.origin,
        audience: base.origin,
        requiredClaims: ['sub', 'exp', 'iat'],
        algorithms: ['EdDSA', 'ES256', 'RS256'],
      });
      if (!payload.sub || payload.emailVerified !== true || payload.banned === true)
        throw new Error('Unverified identity.');
      const allowed = (env.NEON_TEST_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase());
      if (!payload.email || !allowed.includes(payload.email.toLowerCase()))
        throw new AccountError('This internal build is limited to approved testers.', 403);
      return { issuer: payload.iss, subject: payload.sub };
    } catch (error) {
      if (error instanceof AccountError) throw error;
      throw new AccountError('Sign in again.', 401);
    }
  };
}
