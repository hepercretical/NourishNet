import { randomUUID } from 'node:crypto';
import { digest, hashPassword, token, verifyPassword } from './credentials.js';

export class AccountError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function emailAddress(value) {
  if (typeof value !== 'string')
    throw new AccountError('Enter a fictional email ending in .test or .invalid.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.(test|invalid)$/.test(email))
    throw new AccountError('Enter a fictional email ending in .test or .invalid.');
  return email;
}

function passwordValue(value) {
  if (typeof value !== 'string' || value.length < 15 || value.length > 128)
    throw new AccountError('Use a password with 15 to 128 characters.');
  return value;
}

function codeValue(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value))
    throw new AccountError('This code is invalid or expired. Request a new code.');
  return value;
}

function publicAccount(record) {
  return {
    id: record.id,
    displayName: record.display_name,
    timeZone: record.time_zone,
    sharing: false,
  };
}

export function createAuthService({
  repository,
  deliver,
  now = () => new Date(),
  allowGuest = false,
}) {
  async function sendCode(record, purpose) {
    const code = token();
    await repository.issueToken(
      record.id,
      purpose,
      digest(code),
      new Date(now().getTime() + 30 * 60000),
    );
    await deliver({ email: record.email, purpose, code, expiresInMinutes: 30 });
  }

  return {
    // Temporary synthetic local testing only; never use a shared guest identity.
    async guest(body) {
      if (!allowGuest) throw new AccountError('Guest testing is disabled.', 404);
      if (Object.keys(body).length)
        throw new AccountError('Guest testing takes no account details.');
      const id = randomUUID();
      const email = `guest-${id}@nourishnet.invalid`;
      const record = await repository.createAccount({
        id,
        email,
        displayName: 'Guest tester',
        timeZone: 'America/Denver',
        passwordHash: await hashPassword(token()),
      });
      if (!record) throw new AccountError('Guest testing could not start. Try again.', 503);
      const verification = digest(token());
      await repository.issueToken(id, 'verify', verification, new Date(now().getTime() + 60000));
      if (!(await repository.consumeToken(email, 'verify', verification, now())))
        throw new AccountError('Guest testing could not start. Try again.', 503);
      const sessionToken = token();
      await repository.createSession(
        id,
        digest(sessionToken),
        new Date(now().getTime() + 8 * 3600000),
      );
      return { account: publicAccount(record), sessionToken };
    },
    async signup(body) {
      const email = emailAddress(body.email);
      const password = passwordValue(body.password);
      if (body.adult !== true) throw new AccountError('NourishNet is for adults aged 18 and over.');
      const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
      if (!displayName || displayName.length > 80)
        throw new AccountError('Enter a display name with 1 to 80 characters.');
      try {
        new Intl.DateTimeFormat('en', { timeZone: body.timeZone });
      } catch {
        throw new AccountError('Choose a valid timezone.');
      }
      if (typeof body.timeZone !== 'string' || body.timeZone.length > 100)
        throw new AccountError('Choose a valid timezone.');
      const record = await repository.createAccount({
        id: randomUUID(),
        email,
        displayName,
        timeZone: body.timeZone,
        passwordHash: await hashPassword(password),
      });
      if (record) await sendCode(record, 'verify');
      return {
        message:
          'If this address can be registered, a verification code is in the local outbox. You can request a new code if needed.',
      };
    },
    async verify(body) {
      const email = emailAddress(body.email);
      if (!(await repository.consumeToken(email, 'verify', digest(codeValue(body.code)), now())))
        throw new AccountError('This code is invalid or expired. Request a new code.');
      return { message: 'Your fictional account is verified. You can sign in.' };
    },
    async resend(body) {
      const record = await repository.findByEmail(emailAddress(body.email));
      if (record && !record.verified_at) await sendCode(record, 'verify');
      return { message: 'If verification is needed, a new code is in the local outbox.' };
    },
    async login(body) {
      const email = emailAddress(body.email);
      const password = passwordValue(body.password);
      const record = await repository.findByEmail(email);
      if (!record || !(await verifyPassword(password, record.password_hash)))
        throw new AccountError('Email or password is incorrect.', 401);
      if (!record.verified_at)
        throw new AccountError('Verify your fictional email before signing in.', 403);
      const sessionToken = token();
      await repository.createSession(
        record.id,
        digest(sessionToken),
        new Date(now().getTime() + 8 * 3600000),
      );
      return { account: publicAccount(record), sessionToken };
    },
    async session(value) {
      const record =
        typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
          ? await repository.findSession(digest(value), now())
          : null;
      if (!record) throw new AccountError('Your session has expired. Sign in again.', 401);
      return publicAccount(record);
    },
    async logout(value) {
      if (value) await repository.revokeSession(digest(value), now());
    },
    async recover(body) {
      const record = await repository.findByEmail(emailAddress(body.email));
      if (record) await sendCode(record, 'recover');
      return {
        message: 'If this fictional account exists, a recovery code is in the local outbox.',
      };
    },
    async reset(body) {
      const email = emailAddress(body.email);
      const password = passwordValue(body.password);
      if (
        !(await repository.consumeToken(
          email,
          'recover',
          digest(codeValue(body.code)),
          now(),
          await hashPassword(password),
        ))
      )
        throw new AccountError('This code is invalid or expired. Request a new code.');
      return { message: 'Your password was reset. Sign in with the new password.' };
    },
  };
}
