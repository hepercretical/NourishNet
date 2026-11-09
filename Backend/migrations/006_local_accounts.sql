-- Approved by the developer for Plan-05 on 2026-11-09. Local synthetic development only.
-- Depends only on 001; later feature migrations remain staged.
BEGIN;

CREATE TABLE account_credentials (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  email text NOT NULL UNIQUE CHECK (length(email) BETWEEN 3 AND 254 AND email = lower(email)),
  password_hash text NOT NULL,
  adult_confirmed boolean NOT NULL CHECK (adult_confirmed),
  verified_at timestamptz
);

CREATE TABLE account_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  account_id uuid NOT NULL REFERENCES accounts(id),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX account_sessions_owner_idx ON account_sessions(account_id);

CREATE TABLE account_tokens (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  account_id uuid NOT NULL REFERENCES accounts(id),
  purpose text NOT NULL CHECK (purpose IN ('verify', 'recover')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX account_tokens_owner_idx ON account_tokens(account_id, purpose);

COMMIT;
