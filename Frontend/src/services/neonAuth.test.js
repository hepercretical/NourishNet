import { beforeEach, expect, it, vi } from 'vitest';
const { sdk, create } = vi.hoisted(() => {
  const sdk = {
    signUp: { email: vi.fn() },
    signIn: { email: vi.fn() },
    getSession: vi.fn(),
    token: vi.fn(),
    signOut: vi.fn(),
    changePassword: vi.fn(),
    emailOtp: { verifyEmail: vi.fn(), sendVerificationOtp: vi.fn(), resetPassword: vi.fn() },
  };
  return { sdk, create: vi.fn(() => sdk) };
});
vi.mock('@neon/auth', () => ({ createAuthClient: create }));
vi.mock('@neon/auth/react/adapters', () => ({
  BetterAuthReactAdapter: vi.fn((options) => options),
}));
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_NEON_AUTH_URL', 'https://auth.example.test/neondb/auth');
  for (const method of [
    sdk.signUp.email,
    sdk.signIn.email,
    sdk.getSession,
    sdk.token,
    sdk.signOut,
    sdk.changePassword,
    ...Object.values(sdk.emailOtp),
  ])
    method.mockReset().mockResolvedValue({ data: {} });
});
it('uses Neon verification codes and never sends profile ownership or adult claims to sign-in', async () => {
  const { neonAuthRequest } = await import('./neonAuth.js');
  await expect(neonAuthRequest('/auth/signup', { adult: false })).rejects.toThrow('18');
  await neonAuthRequest('/auth/signup', {
    adult: true,
    email: 'test@example.test',
    password: 'test-password-only',
    displayName: 'Fiction',
    accountId: 'forged',
  });
  expect(sdk.signUp.email).toHaveBeenCalledWith({
    email: 'test@example.test',
    password: 'test-password-only',
    name: 'Fiction',
  });
  await neonAuthRequest('/auth/verify', { email: 'test@example.test', code: '123456' });
  expect(sdk.emailOtp.verifyEmail).toHaveBeenCalledWith({
    email: 'test@example.test',
    otp: '123456',
  });
});
it('obtains the JWT from the managed session and signs out through Neon', async () => {
  sdk.getSession.mockResolvedValue({ data: { session: { token: 'opaque-session-token' } } });
  sdk.token.mockResolvedValue({ data: { token: 'mock-jwt' } });
  const { neonToken, neonAuthRequest } = await import('./neonAuth.js');
  expect(await neonToken()).toBe('mock-jwt');
  expect(sdk.token).toHaveBeenCalledOnce();
  await neonAuthRequest('/auth/logout');
  expect(sdk.signOut).toHaveBeenCalledOnce();
});
it('supports code recovery and keeps provider diagnostics out of user errors', async () => {
  const { neonAuthRequest } = await import('./neonAuth.js');
  await neonAuthRequest('/auth/recover', { email: 'test@example.test' });
  expect(sdk.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
    email: 'test@example.test',
    type: 'forget-password',
  });
  await neonAuthRequest('/auth/reset', {
    email: 'test@example.test',
    code: '123456',
    password: 'new-test-password',
  });
  expect(sdk.emailOtp.resetPassword).toHaveBeenCalledWith({
    email: 'test@example.test',
    otp: '123456',
    password: 'new-test-password',
  });
  sdk.signIn.email.mockResolvedValue({ error: { message: 'sensitive provider diagnostic' } });
  await expect(neonAuthRequest('/auth/login', {})).rejects.toThrow('Check your entries');
});

it('does not request a JWT when the managed session is signed out', async () => {
  sdk.getSession.mockResolvedValue({ data: null });
  const { neonToken } = await import('./neonAuth.js');
  expect(await neonToken()).toBeUndefined();
  expect(sdk.token).not.toHaveBeenCalled();
});

it('changes the managed password and revokes sessions before returning success', async () => {
  const { neonAuthRequest } = await import('./neonAuth.js');
  await expect(
    neonAuthRequest('/personal/password', {
      currentPassword: 'current-test-password',
      newPassword: 'new-test-password',
    }),
  ).resolves.toEqual({ saved: true });
  expect(sdk.changePassword).toHaveBeenCalledWith({
    currentPassword: 'current-test-password',
    newPassword: 'new-test-password',
    revokeOtherSessions: true,
  });
  expect(sdk.signOut).toHaveBeenCalledOnce();
  sdk.changePassword.mockResolvedValue({ error: { message: 'private detail' } });
  sdk.signOut.mockClear();
  await expect(neonAuthRequest('/personal/password', {})).rejects.toThrow('Check your entries');
  expect(sdk.signOut).not.toHaveBeenCalled();
});
