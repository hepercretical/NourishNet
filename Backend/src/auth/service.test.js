import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthService } from './service.js';
import { testRepository } from './testRepository.js';
import { digest, hashPassword, verifyPassword } from './credentials.js';

let repository, messages, service, time;
const draft = {
  email: 'avery@example.test',
  password: 'fictional-only-password',
  displayName: 'Avery Fiction',
  timeZone: 'America/Denver',
  adult: true,
};
beforeEach(() => {
  repository = testRepository();
  messages = [];
  time = new Date('2026-11-09T18:00:00Z');
  service = createAuthService({
    repository,
    deliver: async (message) => messages.push(message),
    now: () => time,
  });
});
async function registered(body = draft) {
  await service.signup(body);
  await service.verify({ email: body.email, code: messages.at(-1).code });
  return service.login(body);
}
describe('local synthetic accounts', () => {
  it('stores salted password hashes and only token digests, verifies once and creates a private account session', async () => {
    const { account, sessionToken } = await registered();
    expect(account).toMatchObject({ displayName: 'Avery Fiction', sharing: false });
    expect(repository.accounts.get(draft.email).password_hash).not.toContain(draft.password);
    expect(repository.sessions.has(digest(sessionToken))).toBe(true);
    expect([...repository.tokens.keys()]).not.toContain(messages[0].code);
    expect(await service.session(sessionToken)).toEqual(account);
    await expect(service.verify({ email: draft.email, code: messages[0].code })).rejects.toThrow(
      'invalid or expired',
    );
  });
  it('uses a different salt for each password hash and rejects an incorrect password', async () => {
    const a = await hashPassword(draft.password),
      b = await hashPassword(draft.password);
    expect(a).not.toBe(b);
    expect(await verifyPassword(draft.password, a)).toBe(true);
    expect(await verifyPassword('another fictional password', a)).toBe(false);
    expect(await verifyPassword(draft.password, 'malformed')).toBe(false);
  });
  it.each([
    { adult: false },
    { email: 'real@example.com' },
    { password: 'short' },
    { displayName: '' },
    { timeZone: 'bad timezone' },
  ])('rejects invalid signup %j without creating an account', async (invalid) => {
    await expect(service.signup({ ...draft, ...invalid })).rejects.toThrow();
    expect(repository.accounts.size).toBe(0);
    expect(messages).toHaveLength(0);
  });
  it('requires verification and offers a new code that supersedes the previous one', async () => {
    await service.signup(draft);
    const first = messages[0].code;
    await expect(service.login(draft)).rejects.toMatchObject({ status: 403 });
    await service.resend({ email: draft.email });
    await expect(service.verify({ email: draft.email, code: first })).rejects.toThrow(
      'invalid or expired',
    );
    await service.verify({ email: draft.email, code: messages.at(-1).code });
    expect((await service.login(draft)).account.sharing).toBe(false);
  });
  it('returns the same signup/recovery response for existing and unknown fictional addresses', async () => {
    const first = await service.signup(draft);
    expect(await service.signup(draft)).toEqual(first);
    expect(repository.accounts.size).toBe(1);
    const count = messages.length;
    expect(await service.recover({ email: 'unknown@example.test' })).toEqual(
      await service.recover({ email: draft.email }),
    );
    expect(messages).toHaveLength(count + 1);
  });
  it('rejects incorrect sign-in without creating a session', async () => {
    await registered();
    const count = repository.sessions.size;
    await expect(
      service.login({ ...draft, password: 'wrong fictional password' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(repository.sessions.size).toBe(count);
  });
  it('expires codes after 30 minutes and sessions after eight hours', async () => {
    const session = await registered();
    await service.recover({ email: draft.email });
    const code = messages.at(-1).code;
    time = new Date(time.getTime() + 31 * 60000);
    await expect(service.reset({ ...draft, code })).rejects.toThrow('invalid or expired');
    time = new Date(time.getTime() + 8 * 3600000);
    await expect(service.session(session.sessionToken)).rejects.toMatchObject({ status: 401 });
  });
  it('keeps two accounts isolated and revokes only the signed-out session', async () => {
    const a = await registered();
    const b = await registered({
      ...draft,
      email: 'morgan@example.test',
      displayName: 'Morgan Fiction',
    });
    expect((await service.session(a.sessionToken)).id).not.toBe(
      (await service.session(b.sessionToken)).id,
    );
    await service.logout(a.sessionToken);
    await expect(service.session(a.sessionToken)).rejects.toMatchObject({ status: 401 });
    expect((await service.session(b.sessionToken)).displayName).toBe('Morgan Fiction');
  });
  it('resets with a one-time recovery code, rejects cross-account codes and revokes previous sessions', async () => {
    const a = await registered();
    await registered({ ...draft, email: 'morgan@example.test' });
    await service.recover({ email: draft.email });
    const code = messages.at(-1).code;
    await expect(
      service.reset({ email: 'morgan@example.test', code, password: 'replacement-test-password' }),
    ).rejects.toThrow('invalid or expired');
    await service.reset({ email: draft.email, code, password: 'replacement-test-password' });
    await expect(service.session(a.sessionToken)).rejects.toMatchObject({ status: 401 });
    await expect(service.login(draft)).rejects.toMatchObject({ status: 401 });
    expect(
      (await service.login({ ...draft, password: 'replacement-test-password' })).account.id,
    ).toBe(a.account.id);
    await expect(service.reset({ ...draft, code })).rejects.toThrow('invalid or expired');
  });
  it('allows verification to be retried after local delivery fails', async () => {
    const deliver = vi
      .fn()
      .mockRejectedValueOnce(new Error('outbox unavailable'))
      .mockResolvedValue(undefined);
    const failing = createAuthService({ repository, deliver });
    await expect(failing.signup(draft)).rejects.toThrow('outbox unavailable');
    await failing.resend({ email: draft.email });
    expect(deliver).toHaveBeenCalledTimes(2);
  });
});
