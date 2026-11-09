-- Plan-02 design approved by developer 2026-11-09; staged application only. Apply only to an explicitly approved development target.
-- Shared Plan-19/04 foundation; split before approval if requested separately.
BEGIN;

CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  identity_issuer text NOT NULL CHECK (length(identity_issuer) BETWEEN 1 AND 500),
  identity_subject text NOT NULL CHECK (length(identity_subject) BETWEEN 1 AND 500),
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 80),
  time_zone text NOT NULL CHECK (length(time_zone) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identity_issuer, identity_subject)
);

-- Technical representation bounds, not clinical limits. Less than excludes NaN.
CREATE DOMAIN nutrient_amount AS numeric(12,4)
  CHECK (VALUE >= 0 AND VALUE < 100000000);

CREATE DOMAIN serving_amount AS numeric(12,4)
  CHECK (VALUE > 0 AND VALUE < 100000000);

CREATE TABLE foods (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  provenance text NOT NULL CHECK (provenance IN ('synthetic', 'reviewed-submission')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE food_servings (
  id uuid PRIMARY KEY,
  food_id uuid NOT NULL REFERENCES foods(id),
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 100),
  grams serving_amount,
  calories_kcal nutrient_amount NOT NULL,
  protein_g nutrient_amount NOT NULL,
  fat_g nutrient_amount NOT NULL,
  carbohydrates_g nutrient_amount NOT NULL,
  sodium_mg nutrient_amount
);
CREATE INDEX food_servings_food_idx ON food_servings(food_id);

CREATE TABLE food_barcodes (
  gtin14 text PRIMARY KEY CHECK (gtin14 ~ '^[0-9]{14}$'),
  food_id uuid NOT NULL REFERENCES foods(id)
);
-- Check digit validation and original GTIN normalization are API responsibilities.

-- Same transaction as its feature mutation. Store only owner-scoped responses;
-- recheck current authorization before replay. No automatic expiration policy.
CREATE TABLE write_requests (
  account_id uuid NOT NULL REFERENCES accounts(id),
  operation text NOT NULL CHECK (length(operation) BETWEEN 1 AND 100),
  request_key uuid NOT NULL,
  request_digest text NOT NULL CHECK (request_digest ~ '^[0-9a-f]{64}$'),
  response_status integer NOT NULL CHECK (response_status BETWEEN 200 AND 299),
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, operation, request_key)
);

COMMIT;
