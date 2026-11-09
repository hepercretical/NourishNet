-- Plan-02 design approved by developer 2026-11-09; staged application only. Apply only for approved Plan-09 work.
-- Depends on 001. Snapshots are authoritative; do not join catalog to retotal.
BEGIN;

CREATE TABLE diary_days (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  local_date date NOT NULL CHECK (isfinite(local_date)),
  time_zone text NOT NULL CHECK (length(time_zone) BETWEEN 1 AND 100),
  logging_state text NOT NULL DEFAULT 'incomplete'
    CHECK (logging_state IN ('incomplete', 'complete')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  UNIQUE (account_id, local_date)
);

CREATE TABLE diary_entries (
  id uuid PRIMARY KEY,
  day_id uuid NOT NULL REFERENCES diary_days(id),
  source_serving_id uuid NOT NULL REFERENCES food_servings(id),
  catalog_version integer NOT NULL CHECK (catalog_version > 0),
  meal text NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity serving_amount NOT NULL,
  food_name text NOT NULL CHECK (length(btrim(food_name)) BETWEEN 1 AND 200),
  serving_label text NOT NULL CHECK (length(btrim(serving_label)) BETWEEN 1 AND 100),
  serving_grams serving_amount,
  calories_kcal nutrient_amount NOT NULL,
  protein_g nutrient_amount NOT NULL,
  fat_g nutrient_amount NOT NULL,
  carbohydrates_g nutrient_amount NOT NULL,
  sodium_mg nutrient_amount,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX diary_entries_day_idx ON diary_entries(day_id);

-- Resolve ownership via diary_days.account_id in every entry query/mutation.
COMMIT;
