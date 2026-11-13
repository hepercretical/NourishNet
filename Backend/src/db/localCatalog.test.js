import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';
import {
  importLocalCatalog,
  requireLocalCatalogTarget,
  sha256,
  validateCatalog,
} from './localCatalog.js';

const catalog = JSON.parse(
  await readFile(new URL('../../catalog/manufacturer-foods.json', import.meta.url), 'utf8'),
);
const fairlife = JSON.parse(
  await readFile(
    new URL('../../catalog/fairlife-nutrition-plan-chocolate.json', import.meta.url),
    'utf8',
  ),
);

it('validates the confirmed Fairlife single-bottle barcode and photographed label values without treating mL as grams', () => {
  expect(validateCatalog(fairlife)).toBe(fairlife);
  expect(fairlife.foods).toHaveLength(1);
  expect(fairlife.foods[0]).toMatchObject({
    gtin14: '00811620022118',
    servingBasis: '1 bottle (340 mL)',
    grams: null,
    nutrients: { calories: 150, protein: 30, carbohydrates: 4, fat: 2.5, sodium: 230 },
  });
});
const local = {
  DATABASE_URL: 'postgresql://test:unused@127.0.0.1:55432/nourishnet_plan02_dev',
  DATABASE_EXPECTED_HOST: '127.0.0.1',
  DATABASE_EXPECTED_NAME: 'nourishnet_plan02_dev',
  DATABASE_ENV: 'development',
  DATABASE_SYNTHETIC_ONLY: 'true',
};

it('accepts the proposed source-backed catalog with leading-zero identities and label units', () => {
  expect(validateCatalog(catalog)).toBe(catalog);
  expect(catalog.foods[0]).toMatchObject({
    gtin14: '00030000010204',
    servingBasis: '1/2 cup dry (40 g)',
    nutrients: { calories: 150, sodium: 0 },
  });
  expect(catalog.foods[2].grams).toBeNull();
});

it('rejects malformed labels, identities, amounts, barcodes and unapproved sources before SQL', async () => {
  const invalid = [
    (x) => (x.version = 2),
    (x) => (x.checkedOn = '2026-02-30'),
    (x) => (x.foods = []),
    (x) => x.foods.push(x.foods[0]),
    (x) => (x.foods[0].id = '../secret'),
    (x) => (x.foods[0].name = ''),
    (x) => (x.foods[0].grams = 0),
    (x) => (x.foods[0].nutrients.calories = -1),
    (x) => (x.foods[0].nutrients.protein = 0.12345),
    (x) => (x.foods[0].nutrients.fat = null),
    (x) => (x.foods[0].gtin14 = '00030000010205'),
    (x) => (x.foods[0].sourceUrls = []),
    (x) => (x.foods[0].sourceUrls = ['https://unknown.invalid/label']),
    (x) => (x.foods[0].sourceUrls = ['http://www.jif.com/label']),
    (x) => (x.foods[0].sourceUrls = ['https://user:password@www.jif.com/label']),
  ];
  for (const change of invalid) {
    const draft = structuredClone(catalog);
    change(draft);
    const client = { query: vi.fn() };
    await expect(importLocalCatalog(client, draft)).rejects.toThrow();
    expect(client.query).not.toHaveBeenCalled();
  }
});

it('preserves unknown sodium without converting it into a zero claim', () => {
  const draft = structuredClone(catalog);
  draft.foods[0].nutrients.sodium = null;
  expect(validateCatalog(draft).foods[0].nutrients.sodium).toBeNull();
});

it('refuses hosted URLs, other ports/databases and missing local confirmations', () => {
  expect(requireLocalCatalogTarget(local)).toMatchObject({ ssl: false });
  for (const override of [
    {
      DATABASE_URL: 'postgresql://test:unused@db.example.invalid/nourishnet_plan02_dev',
      DATABASE_EXPECTED_HOST: 'db.example.invalid',
    },
    { DATABASE_URL: local.DATABASE_URL.replace(':55432', ':5432') },
    {
      DATABASE_URL: local.DATABASE_URL.replace('plan02_dev', 'another'),
      DATABASE_EXPECTED_NAME: 'nourishnet_another',
    },
    { DATABASE_SYNTHETIC_ONLY: 'false' },
    { DATABASE_ENV: 'production' },
  ])
    expect(() => requireLocalCatalogTarget({ ...local, ...override })).toThrow();
});

it('inserts food, sources, serving and barcode in one transaction with bound values', async () => {
  const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
  expect(await importLocalCatalog(client, catalog)).toBe(3);
  expect(client.query.mock.calls[0]).toEqual(['BEGIN']);
  expect(client.query.mock.calls.at(-1)).toEqual(['COMMIT']);
  const insert = client.query.mock.calls.find(([sql]) => sql.startsWith('INSERT INTO foods'));
  expect(insert[0]).not.toContain(catalog.foods[0].name);
  expect(insert[1]).toContain(catalog.foods[0].name);
  expect(insert[1]).toContain(JSON.stringify(catalog.foods[0].sourceUrls));
  expect(client.query.mock.calls.some(([sql]) => /DELETE|UPDATE/i.test(sql))).toBe(false);
});

it('rolls back existing identifiers or barcode conflicts rather than overwriting records', async () => {
  const client = {
    query: vi.fn(async (sql) => ({
      rows: sql.startsWith('SELECT f.id') ? [{ id: 'exists' }] : [],
    })),
  };
  await expect(importLocalCatalog(client, catalog)).rejects.toThrow('already exists');
  expect(client.query.mock.calls.at(-1)).toEqual(['ROLLBACK']);
  expect(client.query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(false);
});

it('rolls back the entire import when a serving or barcode write fails', async () => {
  const client = {
    query: vi.fn(async (sql) => {
      if (sql.startsWith('INSERT INTO food_barcodes')) throw new Error('database unavailable');
      return { rows: [] };
    }),
  };
  await expect(importLocalCatalog(client, catalog)).rejects.toThrow('database unavailable');
  expect(client.query.mock.calls.at(-1)).toEqual(['ROLLBACK']);
  expect(client.query).not.toHaveBeenCalledWith('COMMIT');
});

it('identifies the exact reviewed bytes instead of ignoring whitespace changes', () => {
  expect(sha256('catalog')).toMatch(/^[0-9a-f]{64}$/);
  expect(sha256('catalog\n')).not.toBe(sha256('catalog'));
});

it('previews exact files, sources and checksums without database configuration', () => {
  const command = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../../scripts/local-catalog.js', import.meta.url)), 'plan'],
    { encoding: 'utf8', env: {} },
  );
  expect(command.status).toBe(0);
  const result = JSON.parse(command.stdout);
  expect(result.migration).toMatchObject({
    name: '008_actual_food_catalog.sql',
    sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
  expect(result.catalog.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(result.foods).toEqual(catalog.foods);
});

it('stops apply before connecting when exact approvals are absent', () => {
  const command = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../../scripts/local-catalog.js', import.meta.url)), 'apply'],
    { encoding: 'utf8', env: { ...local } },
  );
  expect(command.status).toBe(1);
  expect(command.stdout).toBe('');
  expect(command.stderr).toContain('Local catalog command stopped');
  expect(command.stderr).not.toContain(local.DATABASE_URL);
});

it('previews a manual catalog addition without database configuration or writes', () => {
  const command = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../../scripts/import-local-food.js', import.meta.url)),
      'manufacturer-foods.json',
    ],
    { encoding: 'utf8', env: {} },
  );
  expect(command.status).toBe(0);
  expect(JSON.parse(command.stdout)).toMatchObject({
    status: 'proposal only; no connection or writes',
    foods: catalog.foods,
  });
});

it.each([['../.env'], ['manufacturer-foods.json', 'wrong-checksum']])(
  'refuses unsafe manual import arguments %s before connecting',
  (...args) => {
    const command = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../../scripts/import-local-food.js', import.meta.url)), ...args],
      { encoding: 'utf8', env: {} },
    );
    expect(command.status).toBe(1);
    expect(command.stdout).toBe('');
    expect(command.stderr).toContain('Local food import stopped');
  },
);
