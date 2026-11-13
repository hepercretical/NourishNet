-- Prepared for human review. Never apply automatically or to a remote database.
-- Depends on 001; additive local personal tracking only. Does not apply staged 004/005.
BEGIN;

CREATE TABLE personal_goal_versions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  effective_date date NOT NULL CHECK (isfinite(effective_date)),
  calories numeric(12,4) NOT NULL CHECK (calories > 0),
  mode text NOT NULL CHECK (mode IN ('deficit', 'surplus', 'maintain')),
  macro_mode text NOT NULL CHECK (macro_mode IN ('grams', 'percent')),
  macros jsonb NOT NULL CHECK (jsonb_typeof(macros) = 'object'),
  provenance jsonb NOT NULL CHECK (jsonb_typeof(provenance) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX personal_goals_owner_date_idx
  ON personal_goal_versions(account_id, effective_date, created_at, id);

CREATE TABLE personal_weight_versions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  local_date date NOT NULL CHECK (isfinite(local_date)),
  weight_kg numeric(12,4) NOT NULL CHECK (weight_kg > 0),
  removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX personal_weights_owner_date_idx
  ON personal_weight_versions(account_id, local_date, created_at, id);

CREATE TABLE personal_appearance (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  mode text NOT NULL CHECK (mode IN ('light', 'dark')),
  accent text NOT NULL CHECK (accent IN ('green', 'blue', 'purple', 'red')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0)
);

COMMIT;
