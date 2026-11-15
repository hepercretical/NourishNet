import { createHash } from 'node:crypto';
import { nutritionAmount, localDate } from './validation.js';
import { requireSyntheticDevelopment } from './config.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const nutrients = ['calories', 'carbohydrates', 'fat', 'protein', 'sodium'];
const sourceHosts = new Set([
  'digitalassets.pepsico.com',
  'fairlife.com',
  'smartlabel.coca-colaproductfacts.com',
  'smartlabel.pepsico.info',
  'www.jif.com',
  'smartlabel.1worldsync.com',
  'www.cheerios.com',
  'smartlabel.generalmills.com',
]);

export function requireLocalCatalogTarget(env = process.env) {
  const config = requireSyntheticDevelopment(env);
  const target = new URL(config.connectionString);
  if (
    target.hostname !== '127.0.0.1' ||
    (target.port || '5432') !== '55432' ||
    decodeURIComponent(target.pathname.slice(1)) !== 'nourishnet_plan02_dev'
  )
    throw new Error('Catalog work requires the existing loopback-only local development target.');
  return config;
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

// Validating canonical IDs here protects import integrity. Scanner normalization
// and accepted scan formats belong to Plan-14, after this prerequisite is done.
function canonicalGtin(value) {
  if (typeof value !== 'string' || !/^\d{14}$/.test(value) || /^0+$/.test(value)) return false;
  const sum = [...value.slice(0, -1)].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1),
    0,
  );
  return (10 - (sum % 10)) % 10 === Number(value.at(-1));
}

export function validateCatalog(value) {
  const fail = () => {
    throw new Error(
      'Review the catalog version, identity, serving, nutrients, barcode and sources.',
    );
  };
  if (value?.version !== 1 || !Array.isArray(value.foods) || !value.foods.length) fail();
  localDate(value.checkedOn);
  if (value.foods.length > 100) fail();
  const identities = new Set();
  const barcodes = new Set();
  for (const food of value.foods) {
    if (!food || typeof food !== 'object') fail();
    for (const id of [food.id, food.servingId]) {
      if (typeof id !== 'string' || !uuid.test(id) || identities.has(id)) fail();
      identities.add(id);
    }
    if (
      typeof food.name !== 'string' ||
      food.name.trim() !== food.name ||
      food.name.length < 1 ||
      food.name.length > 200 ||
      typeof food.servingBasis !== 'string' ||
      !food.servingBasis.trim() ||
      food.servingBasis.length > 100 ||
      !canonicalGtin(food.gtin14) ||
      barcodes.has(food.gtin14)
    )
      fail();
    barcodes.add(food.gtin14);
    nutritionAmount(food.grams, { positive: true, nullable: true });
    if (
      Object.keys(food.nutrients || {})
        .sort()
        .join(',') !== nutrients.join(',')
    )
      fail();
    for (const name of nutrients)
      nutritionAmount(food.nutrients[name], { nullable: name === 'sodium' });
    if (!Array.isArray(food.sourceUrls) || !food.sourceUrls.length || food.sourceUrls.length > 5)
      fail();
    for (const source of food.sourceUrls) {
      const url = new URL(source);
      if (
        url.protocol !== 'https:' ||
        !sourceHosts.has(url.hostname) ||
        url.username ||
        url.password ||
        url.port ||
        url.hash ||
        source.length > 1000
      )
        fail();
    }
  }
  return value;
}

// Shared transaction for explicit, checksum-confirmed catalog releases. Callers
// validate their approved local/hosted target before supplying the client. It
// neither opens a connection nor creates identities/diary entries itself.
export async function importLocalCatalog(client, input) {
  const catalog = validateCatalog(input);
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock($1)', [2026110902]);
    for (const food of catalog.foods) {
      const collision = await client.query(
        `SELECT f.id FROM foods f
         WHERE f.id = $1 OR EXISTS (
           SELECT 1 FROM food_barcodes b WHERE b.food_id = f.id AND b.gtin14 = $2
         ) OR EXISTS (
           SELECT 1 FROM food_servings s WHERE s.food_id = f.id AND s.id = $3
         )`,
        [food.id, food.gtin14, food.servingId],
      );
      // Imports never update existing foods; a repeated import is a clear error,
      // not an implicit catalog correction or a duplicate with a different ID.
      if (collision.rows.length)
        throw new Error('Catalog identity already exists; no import applied.');
      await client.query(
        `INSERT INTO foods (id, name, provenance, source_urls, source_checked_on, catalog_active)
         VALUES ($1, $2, 'manufacturer-label', $3::jsonb, $4::date, true)`,
        [food.id, food.name, JSON.stringify(food.sourceUrls), catalog.checkedOn],
      );
      await client.query(
        `INSERT INTO food_servings (id, food_id, label, grams, calories_kcal, protein_g,
         fat_g, carbohydrates_g, sodium_mg) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          food.servingId,
          food.id,
          food.servingBasis,
          food.grams,
          food.nutrients.calories,
          food.nutrients.protein,
          food.nutrients.fat,
          food.nutrients.carbohydrates,
          food.nutrients.sodium,
        ],
      );
      await client.query('INSERT INTO food_barcodes (gtin14, food_id) VALUES ($1, $2)', [
        food.gtin14,
        food.id,
      ]);
    }
    await client.query('COMMIT');
    return catalog.foods.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
