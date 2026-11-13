-- Prepared for explicit human review; do not apply from startup/build/deploy hooks.
-- Depends on 001 and 003. Private small-test uploads only; no public photo URLs.
BEGIN;

CREATE TABLE hosted_submission_photos (
  storage_key text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  submission_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 2097152),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  contents bytea NOT NULL CHECK (octet_length(contents) = byte_size),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hosted_submission_photos_owner_idx ON hosted_submission_photos(account_id);

-- Photo creation precedes the submission transaction; a submission FK would
-- prevent that sequence. Failed uncommitted submissions discard only new keys;
-- ambiguous commits retain files for reviewed recovery rather than breaking rows.
COMMIT;
