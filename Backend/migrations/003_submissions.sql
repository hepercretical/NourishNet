-- Plan-02 design approved by developer 2026-11-09; staged application only. Apply only for approved Plan-16/26 work.
-- Depends on 001. Storage/reviewer rules need their feature approvals first.
BEGIN;

CREATE TABLE submissions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  gtin14 text NOT NULL CHECK (gtin14 ~ '^[0-9]{14}$'),
  front_image_key text NOT NULL CHECK (length(front_image_key) BETWEEN 1 AND 500),
  label_image_key text NOT NULL CHECK (length(label_image_key) BETWEEN 1 AND 500),
  product jsonb NOT NULL CHECK (jsonb_typeof(product) = 'object'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'needs-review', 'approved', 'rejected')),
  published_food_id uuid UNIQUE REFERENCES foods(id),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'approved') = (published_food_id IS NOT NULL))
);
CREATE INDEX submissions_owner_idx ON submissions(account_id, created_at, id);

CREATE TABLE submission_reviews (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES submissions(id),
  reviewer_account_id uuid NOT NULL REFERENCES accounts(id),
  decision text NOT NULL CHECK (decision IN ('needs-review', 'approve', 'reject')),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 2000),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submission_reviews_submission_idx ON submission_reviews(submission_id);

-- API validates product allowlist/types before storage. Publication, barcode
-- uniqueness and review event must commit atomically; row checks alone cannot
-- authorize a reviewer or enforce transitions across multiple tables.
COMMIT;
