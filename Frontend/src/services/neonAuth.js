import { createAuthClient } from '@neon/auth';
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters';

let client;
function auth() {
  if (!client) {
    const url = import.meta.env.VITE_NEON_AUTH_URL;
    if (!url?.startsWith('https://')) throw new Error('Neon Auth is not configured.');
    client = createAuthClient(url, {
      adapter: BetterAuthReactAdapter({ fetchOptions: { credentials: 'include' } }),
    });
  }
  return client;
}
async function checked(promise) {
  const result = await promise;
  if (result.error)
    throw new Error('Authentication could not complete. Check your entries or request a new code.');
  return result.data;
}
export async function neonToken() {
  const session = await checked(auth().getSession());
  if (!session?.session) return undefined;
  const data = await checked(auth().token());
  return data?.token;
}
export async function neonAuthRequest(path, body = {}) {
  const api = auth();
  switch (path) {
    case '/personal/password':
      await checked(
        api.changePassword({
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
          revokeOtherSessions: true,
        }),
      );
      await checked(api.signOut());
      return { saved: true };
    case '/auth/signup':
      if (body.adult !== true) throw new Error('NourishNet is for adults aged 18 and over.');
      await checked(
        api.signUp.email({ email: body.email, password: body.password, name: body.displayName }),
      );
      return { message: 'Check your test mailbox for a verification code.' };
    case '/auth/login':
      await checked(api.signIn.email({ email: body.email, password: body.password }));
      return { signedIn: true };
    case '/auth/verify':
      await checked(api.emailOtp.verifyEmail({ email: body.email, otp: body.code }));
      return { message: 'Email verified. Sign in to continue.' };
    case '/auth/resend':
    case '/auth/recover':
      await checked(
        api.emailOtp.sendVerificationOtp({
          email: body.email,
          type: path === '/auth/recover' ? 'forget-password' : 'email-verification',
        }),
      );
      return { message: 'If this test account is eligible, a code has been sent.' };
    case '/auth/reset':
      await checked(
        api.emailOtp.resetPassword({ email: body.email, otp: body.code, password: body.password }),
      );
      return { message: 'Password reset. Sign in again.' };
    case '/auth/logout':
      await checked(api.signOut());
      return null;
    default:
      throw new Error('Unsupported authentication action.');
  }
}
