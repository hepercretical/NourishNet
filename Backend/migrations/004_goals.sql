-- Plan-02 design approved by developer 2026-11-09; staged application only. Depends on 001 and reviewed Plan-21 spec.
-- No clinical thresholds, biological-sex categories or formulas are selected.
BEGIN;

CREATE TABLE goal_versions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  effective_date date NOT NULL CHECK (isfinite(effective_date)),
  objective text NOT NULL CHECK (objective IN ('gain', 'lose', 'maintain', 'muscle-gain')),
  specification_version text NOT NULL
    CHECK (length(btrim(specification_version)) BETWEEN 1 AND 100),
  accepted_inputs jsonb NOT NULL CHECK (jsonb_typeof(accepted_inputs) = 'object'),
  accepted_targets jsonb NOT NULL CHECK (jsonb_typeof(accepted_targets) = 'object'),
  accepted_at timestamptz NOT NULL,
  UNIQUE (account_id, effective_date)
);

-- API must validate exact JSON keys/units/bounds against the approved spec,
-- record deliberate acceptance after the visible estimate notice, and forbid
-- edits/deletes/retroactive insertion in normal flows. No outcome computation.
COMMIT;
