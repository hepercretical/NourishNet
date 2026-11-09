import { describe, expect, it } from 'vitest';
import { databaseConfig, requireSyntheticDevelopment } from './config.js';

const settings = {
  DATABASE_ENV: 'development',
  DATABASE_URL: 'postgresql://fixture:synthetic-only@127.0.0.1:55432/nourishnet_dev',
  DATABASE_EXPECTED_HOST: '127.0.0.1',
  DATABASE_EXPECTED_NAME: 'nourishnet_dev',
  DATABASE_SYNTHETIC_ONLY: 'true',
};

describe('backend database configuration', () => {
  it('permits the explicitly pinned local synthetic development target', () => {
    expect(requireSyntheticDevelopment(settings)).toMatchObject({ ssl: false, max: 5 });
  });
  it('requires certificate verification for a remote target even with sslmode=require', () => {
    const config = databaseConfig({
      ...settings,
      DATABASE_URL:
        'postgresql://fixture:synthetic-only@db.synthetic.invalid/nourishnet_dev?sslmode=require',
      DATABASE_EXPECTED_HOST: 'db.synthetic.invalid',
    });
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
    expect(config.connectionString).not.toContain('sslmode');
  });
  it.each([
    { DATABASE_URL: undefined },
    { DATABASE_URL: 'invalid-secret-value' },
    { DATABASE_EXPECTED_HOST: 'another.invalid' },
    { DATABASE_EXPECTED_NAME: 'another_database' },
    { DATABASE_ENV: undefined },
    { DATABASE_URL: settings.DATABASE_URL + '?sslmode=disable' },
    { DATABASE_URL: settings.DATABASE_URL + '?sslcert=untrusted' },
    { DATABASE_URL: 'https://fixture:synthetic-only@127.0.0.1/nourishnet_dev' },
  ])('rejects unsafe or incomplete settings without disclosing the URL', (override) => {
    expect(() => databaseConfig({ ...settings, ...override })).toThrow(
      'Database configuration is missing or invalid. Check backend settings.',
    );
  });
  it.each(['preview', 'production'])('does not migrate or seed %s', (environment) => {
    expect(() => requireSyntheticDevelopment({ ...settings, DATABASE_ENV: environment })).toThrow(
      'synthetic development',
    );
  });
  it('requires an explicit synthetic-data confirmation', () => {
    expect(() =>
      requireSyntheticDevelopment({ ...settings, DATABASE_SYNTHETIC_ONLY: 'false' }),
    ).toThrow();
  });
});
