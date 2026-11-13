import { beforeAll, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { neonVerifier } from './neon.js';

const origin = 'https://auth.example.test';
let keys, verify;
beforeAll(async () => {
  keys = await generateKeyPair('ES256');
  const jwk = await exportJWK(keys.publicKey);
  verify = neonVerifier(
    { NEON_AUTH_BASE_URL: `${origin}/neondb/auth`, NEON_TEST_EMAILS: 'tester@example.test' },
    createLocalJWKSet({ keys: [{ ...jwk, kid: 'test' }] }),
  );
});
async function request(claims = {}, issuer = origin, expires = '5m') {
  const token = await new SignJWT({ email: 'tester@example.test', emailVerified: true, ...claims })
    .setProtectedHeader({ alg: 'ES256', kid: 'test' })
    .setSubject('test-actor')
    .setIssuer(issuer)
    .setAudience(origin)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(keys.privateKey);
  return new Request('https://app.example.test/api/diary', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
it('accepts only a verified signed identity and returns no email or token', async () => {
  expect(await verify(await request())).toEqual({ issuer: origin, subject: 'test-actor' });
});
it('rejects missing, expired, wrong-issuer and unverified tokens', async () => {
  for (const req of [
    new Request('https://app.example.test'),
    await request({}, origin, '-1s'),
    await request({}, 'https://wrong.test'),
    await request({ emailVerified: false }),
    await request({ banned: true }),
  ]) {
    await expect(verify(req)).rejects.toMatchObject({ status: 401 });
  }
});
it('denies authenticated users who are outside the internal tester list', async () => {
  await expect(verify(await request({ email: 'other@example.test' }))).rejects.toMatchObject({
    status: 403,
  });
});
