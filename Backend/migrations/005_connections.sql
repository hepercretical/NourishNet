-- Plan-02 design approved by developer 2026-11-09; staged application only. Depends on 001 and Plan-24 policy decisions.
BEGIN;

CREATE TABLE connections (
  id uuid PRIMARY KEY,
  account_low uuid NOT NULL REFERENCES accounts(id),
  account_high uuid NOT NULL REFERENCES accounts(id),
  requested_by uuid NOT NULL REFERENCES accounts(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (account_low < account_high),
  CHECK (requested_by IN (account_low, account_high)),
  UNIQUE (account_low, account_high),
  UNIQUE (id, account_low, account_high)
);

CREATE TABLE connection_sharing (
  connection_id uuid NOT NULL,
  account_low uuid NOT NULL,
  account_high uuid NOT NULL,
  shared_by uuid NOT NULL REFERENCES accounts(id),
  progress_field text NOT NULL
    CHECK (progress_field IN ('calories', 'protein', 'fat', 'carbohydrates', 'sodium')),
  CHECK (shared_by IN (account_low, account_high)),
  FOREIGN KEY (connection_id, account_low, account_high)
    REFERENCES connections(id, account_low, account_high),
  PRIMARY KEY (connection_id, shared_by, progress_field)
);

CREATE TABLE account_blocks (
  blocker_id uuid NOT NULL REFERENCES accounts(id),
  blocked_id uuid NOT NULL REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (blocker_id <> blocked_id),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE abuse_reports (
  id uuid PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES accounts(id),
  reported_id uuid NOT NULL REFERENCES accounts(id),
  reason text NOT NULL
    CHECK (reason IN ('harassment', 'impersonation', 'unsafe-content', 'other')),
  details text NOT NULL DEFAULT '' CHECK (length(details) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_id)
);

-- Accepted/unblocked checks and participant authorization require transactional
-- API logic. Removal/blocking deletes sharing in that transaction. Acceptance
-- inserts no sharing. A report never becomes a public relationship property.
COMMIT;
