-- Hosted account onboarding. Prepared for human review; not automatically applied.
-- Depends on 001_identity_catalog.sql. Stores no passwords or email addresses.
BEGIN;
CREATE TABLE hosted_account_profiles (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  adult_confirmed boolean NOT NULL CHECK (adult_confirmed),
  confirmed_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
