-- Plan-02 synthetic fixture approved by developer 2026-11-09 for local development.
-- Only for a separately approved, clean synthetic development DB after 001.
-- Fictional arithmetic fixtures, NOT real nutrition facts or usable identities.
-- Deliberately no ON CONFLICT: unexpected existing data must fail/roll back.
BEGIN;

INSERT INTO accounts (id, identity_issuer, identity_subject, display_name, time_zone)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'synthetic.invalid', 'fixture-avery',
    'Avery Finch (synthetic)', 'America/Denver'),
  ('00000000-0000-4000-8000-000000000002', 'synthetic.invalid', 'fixture-morgan',
    'Morgan Reed (synthetic)', 'Pacific/Auckland');

INSERT INTO foods (id, name, provenance)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Sample oat bowl (synthetic)', 'synthetic'),
  ('10000000-0000-4000-8000-000000000002',
    'Sample lentil and roasted vegetable bowl with herb dressing (synthetic)', 'synthetic');

INSERT INTO food_servings
  (id, food_id, label, grams, calories_kcal, protein_g, fat_g, carbohydrates_g, sodium_mg)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
    '1 sample bowl', 100, 100, 4, 2, 16.5, 0),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
    '1 sample bowl', 250, 320, 18, 8, 44, NULL);

-- No invented real-world barcode mappings; known/unknown GTIN fixtures belong
-- to Plan-13. No goals, sharing grants, credentials or uploaded photos seeded.
COMMIT;
