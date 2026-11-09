import { describe, expect, it, vi } from 'vitest';
import { identityRepository } from './identity.js';

describe('account identity contract', () => {
  it('keeps a hostile subject in bound values and returns only the internal account ID', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: 'synthetic-account' }] });
    const subject = "subject' OR 1=1 --";
    expect(
      await identityRepository({ query }).findAccount({ issuer: 'synthetic.invalid', subject }),
    ).toBe('synthetic-account');
    expect(query).toHaveBeenCalledWith(
      'SELECT id FROM accounts WHERE identity_issuer = $1 AND identity_subject = $2',
      ['synthetic.invalid', subject],
    );
    expect(query.mock.calls[0][0]).not.toContain(subject);
  });
  it('returns no account for an unmapped identity', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    expect(
      await identityRepository({ query }).findAccount({
        issuer: 'synthetic.invalid',
        subject: 'unknown',
      }),
    ).toBeNull();
  });
  it('rejects missing identity before any database call', async () => {
    const query = vi.fn();
    await expect(
      identityRepository({ query }).findAccount({ issuer: 'synthetic.invalid' }),
    ).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
  it('propagates an unavailable database to the service error boundary', async () => {
    const query = vi.fn().mockRejectedValue(new Error('synthetic database failure'));
    await expect(
      identityRepository({ query }).findAccount({
        issuer: 'synthetic.invalid',
        subject: 'fixture',
      }),
    ).rejects.toThrow('synthetic database failure');
  });
});
