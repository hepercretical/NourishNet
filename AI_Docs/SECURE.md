# SECURE.md

## Implementation timing approved 2026-11-09

Implement and verify this document's security requirements only after Sprint 3,
in the post-Sprint-3 phase of `PLAN.md` (Plan-20, Plan-28, and Plan-27). They are
not acceptance gates for completing initial design/functionality by Sprint 3
Week 1 or its bug-fix/quality week. The requirements below are preserved in full;
this timing clarification governs earlier wording about when they are required.

Sprints 1-3 deliver an internal development version using synthetic accounts,
measurements, diary entries, and non-personal sample uploads. Public release and
real-user onboarding follow the post-Sprint-3 requirements and release approval.
Existing AGENTS.md requirements still apply, including backend-only Neon access,
secret protection, parameterized SQL, approval boundaries, and the estimate notice.
Keep existing safeguards and .gitignore entries; deferral does not require
removing them. Functional account ownership, sharing choices, and catalog-review
behavior remain product features; adversarial verification and production
hardening are scheduled after Sprint 3.

## Purpose

This document defines the minimum security practices for NourishNet before any
public release. NourishNet stores food logs, nutrition information, account data,
and potentially sensitive health-related information. Security work must protect
confidentiality, integrity, availability, and user control over that data.

These rules are a project baseline, not a certification or legal opinion. Use
OWASP ASVS as the application-security verification baseline and NIST SSDF as the
secure-development lifecycle reference. A public release requires a human
developer review and, where appropriate, review by qualified security and legal
professionals.

## Include these practices

### Secrets and source control

- Never commit passwords, API keys, access tokens, private certificates, signing
  keys, Neon connection strings, production URLs containing credentials, `.env`
  files, database dumps, user uploads, or private test fixtures.
- Keep secrets in local ignored files for development and in Netlify/backend
  secret management for deployment. Frontend variables prefixed with `VITE_`
  are public and must never contain secrets.
- Use `.env.example` files containing variable names and safe placeholders only.
- Keep the repository `.gitignore` current for root, `Frontend/`, and `Backend/`
  artifacts. Review `git status` and staged files before every commit; ignoring a
  file does not remove a secret that was already committed.
- If a secret is exposed, stop using it, revoke and rotate it immediately, remove
  it from repository history using the approved process, and record the incident.
- Enable branch protection, required reviews, least-privilege repository access,
  and secret scanning/dependency alerts in GitHub before public release.

The repository must ignore at least the following categories:

```gitignore
# Secrets and local configuration
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
secrets/

# Dependencies and build output
node_modules/
dist/
build/
.vite/
.netlify/
coverage/

# Databases, exports, logs, and user-uploaded files
*.db
*.sqlite
*.sqlite3
*.dump
*.sql.gz
uploads/
storage/
*.log

# Operating-system and editor files
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.example.json
```

The actual root `.gitignore` must be checked against this list and adjusted for
the tools actually adopted by the project.

### User data and privacy by design

- Collect only data needed for a clearly documented feature. Do not collect
  contacts, precise location, health diagnoses, or identifying metadata unless a
  reviewed feature requires it.
- Give each data field a purpose, retention period, access rule, and deletion
  path. Delete or anonymize data when it is no longer needed.
- Separate account identity, diary entries, barcode submissions, and moderation
  records. Use opaque IDs rather than exposing sequential database IDs.
- Enforce authorization on every backend request, including object-level checks
  so one user cannot read, edit, or delete another user's entries.
- Do not use user nutrition or diary data for advertising, model training, or
  analytics without clear disclosure and the required permission.
- Do not put food logs, email addresses, tokens, uploaded images, or full request
  bodies in browser console logs, server logs, analytics, error trackers, or URLs.
- Provide authenticated export and deletion workflows and verify that deletion
  reaches primary records, uploads, caches, backups according to the stated
  retention policy, and third-party processors where applicable.

### Authentication and sessions

- Use a maintained authentication provider or a reviewed server-side
  implementation. Never implement password hashing or token handling casually.
- Store passwords only as slow, salted password hashes using a current approved
  password-hashing algorithm. Never log or email passwords.
- Require strong passwords, rate-limit authentication and recovery, and provide
  secure account recovery. Require MFA for administrators and reviewers.
- Use short-lived sessions, secure rotation/revocation, `HttpOnly`, `Secure`, and
  appropriate `SameSite` cookies, and CSRF protection for cookie-authenticated
  state-changing requests.
- Avoid storing long-lived authentication tokens in `localStorage`.
- Enforce authorization server-side; hiding a button is not an authorization check.

### API, database, and input security

- Validate all input on the server with allowlists, length limits, type checks,
  and business rules. Treat browser validation as convenience only.
- Use parameterized SQL and least-privilege database roles. Never concatenate
  user input into SQL, shell commands, paths, HTML, or regular expressions.
- Encode output for its context and use a restrictive Content Security Policy.
- Configure CORS to the known frontend origins; never use `*` with credentials.
- Add rate limits and abuse controls to authentication, search, uploads, barcode
  lookup, and submission endpoints.
- Use HTTPS everywhere, redirect HTTP to HTTPS, enable HSTS after verification,
  and configure secure security headers.
- Return generic public errors while logging a correlation ID and useful internal
  details without secrets or sensitive user content.
- Use database migrations, backups, restore tests, transactions, constraints,
  and audit events for important changes.

### File uploads and barcode submissions

- Accept only required image types, verify MIME type and file signature, enforce
  size and dimension limits, strip unnecessary metadata, and generate server-side
  filenames.
- Store uploads outside the executable/public web root with private access and
  short-lived signed download URLs. Scan files where practical.
- Never trust client-provided file names, extensions, barcode values, or nutrition
  values. Do not execute or render uploaded content as active HTML.
- Keep unreviewed submissions separate from the searchable food catalog. Record
  reviewer actions and prevent an upload from becoming trusted data automatically.

### Dependencies, delivery, and operations

- Pin and review dependencies, commit lockfiles, remove unused packages, and use
  automated dependency and secret scanning. Do not install a package without the
  human developer's approval.
- Run linting, tests, build checks, static analysis, and security checks in CI.
  Review production source-map settings and do not publish source maps containing
  private source unless explicitly intended.
- Maintain separate development, preview, and production environments and data.
  Never use real user data in development or tests.
- Limit production access, use MFA, rotate credentials, review access regularly,
  and keep backups encrypted and access-controlled.
- Monitor authentication failures, authorization failures, unusual exports,
  upload abuse, and service health. Do not monitor by collecting unnecessary
  user content.
- Maintain a vulnerability-reporting contact, incident-response plan, breach
  decision tree, recovery procedure, and tested backups. Preserve evidence while
  limiting exposure during an incident.

### Verification before public release

- Threat-model accounts, diary records, uploads, admin/reviewer actions, APIs,
  third-party services, and deployment configuration.
- Verify the OWASP ASVS Level 2-relevant controls for this sensitive-data app,
  including authentication, access control, validation, data protection, file
  handling, API security, and configuration.
- Test IDOR/BOLA, XSS, CSRF, SQL injection, SSRF, credential abuse, rate limits,
  upload bypasses, insecure direct downloads, CORS, security headers, and error
  leakage.
- Test account export, deletion, consent withdrawal, session revocation, backup
  restore, and incident notification procedures.
- Keep a dated security review with findings, owners, severity, remediation, and
  accepted risks. Do not claim “secure,” “HIPAA compliant,” or “certified” without
  a documented basis and qualified review.

## Avoid these practices

- Do not put secrets in frontend source, `VITE_` variables, GitHub issues, test
  snapshots, screenshots, chat messages, or logs.
- Do not rely on `.gitignore` as the only secret control; verify staged content
  and rotate anything exposed.
- Do not connect the browser directly to Neon or expose admin database credentials.
- Do not trust client-side authorization, hidden UI, client-calculated totals, or
  client-supplied ownership IDs.
- Do not return full database rows, stack traces, tokens, or personal data in
  errors or APIs that do not need them.
- Do not use production user data for local development, demos, screenshots, or
  automated tests.
- Do not silently add third-party analytics, advertising, session replay, OCR, or
  AI services that receive user data. Obtain approval, document the purpose, and
  update notices and consent first.
- Do not retain uploads or diary data indefinitely “just in case.”
- Do not release with known critical/high vulnerabilities, unreviewed migrations,
  untested restore procedures, or an undocumented incident-response owner.

## Account, goal, and social-data controls (reviewed 2026-11-09)

- Use stable OWASP ASVS 5.0.0, targeting Level 2 with a recorded applicability
  matrix, test evidence, owners, and approved exceptions. Recheck the stable
  version before implementation; a checklist alone does not establish security.
- Threat-model goal inputs, historical goal versions, calendar responses,
  connection requests, sharing changes, blocked users, and catalog moderation.
  Test with an owner, an accepted connection, an unrelated user, a blocked user,
  and a reviewer. Opaque IDs do not replace authorization.
- Derive ownership from the authenticated session. Deny access by default and
  check the current relationship and field-level sharing permissions on every
  calendar/API request, including bulk exports, pagination, and downloads.
- Keep biological sex, age, height, weight, and detailed diaries private. Return
  only deliberately shared daily goal-progress fields to accepted connections.
  Accepting a connection alone must not silently enable sharing.
- Revocation, blocking, or removal must stop subsequent reads, invalidate shared
  caches, and remove relevant cached UI data. Do not promise to retract copies
  already seen or saved by another person. Prevent blocked users from finding
  private activity through counts, errors, notifications, or alternate endpoints.
- Limit account discovery and connection requests to prevent enumeration,
  scraping, harassment, and repeated requests. Do not expose email addresses.
  Reports and moderation tools require restricted roles and audit events.

### Identity and request integrity

- For locally managed passwords, follow NIST SP 800-63B-4: at least 15 characters
  for password-only authentication, allow at least 64, screen against compromised
  values, allow paste/password managers, and avoid arbitrary composition rules
  and periodic changes without evidence of compromise. Use a reviewed salted
  adaptive password hash such as Argon2id with current OWASP parameters; keep
  parameters versioned and upgrade hashes as needed. Prefer reviewed providers.
- Verify email ownership; recovery tokens are random, single-use, short-lived,
  and stored hashed. Use generic authentication/recovery responses. Reauthenticate
  for sensitive account changes, exports, and deletion; revoke sessions after
  password recovery and account deletion. Offer user MFA and require admin MFA.
- Validate signature, issuer, audience, expiry, and allowed algorithm for signed
  tokens. If OAuth/OIDC is adopted, use a maintained library, authorization code
  with PKCE, state/nonce validation, and exact approved redirect destinations.
- Rotate session IDs at login and privilege changes, define idle/absolute
  timeouts, and revoke on logout. Never transmit tokens in URLs. Prefer host-only
  cookies; configure CSRF tokens/origin checks in addition to SameSite controls.
- Enforce idempotency for diary writes, submissions, and request retries using
  actor-scoped keys and database constraints/transactions. Disabling a button
  alone does not prevent duplicate writes. Reject reuse with a different payload.
- Bound numeric values, precision, pagination, request bodies, expensive queries,
  and execution time; reject NaN/infinity and unauthorized field updates. Specify
  allowed fields explicitly to prevent mass assignment. Rate limits must work
  across serverless instances, with per-account and abuse-aware network limits.

### Browser, upload, and external-service protection

- Keep React text escaping intact; avoid raw HTML rendering. If rich content is
  ever approved, use a maintained sanitizer. Do not render uploaded SVG/HTML.
- Test CSP with an inventory of required sources; avoid unsafe-inline/eval where
  possible. Include frame-ancestors, nosniff, a restrictive Referrer-Policy, and
  Permissions-Policy allowing camera only where needed. Set private responses to
  Cache-Control: no-store; exclude diaries/goals from CDN and service-worker caches.
- Authorize both upload initiation and completion. Quarantine uploads, decode and
  re-encode supported images with resource limits, remove EXIF/location metadata,
  enforce dimensions/pixel counts and byte quotas, and clean up abandoned files.
  Use malware scanning where supported; document any alternative before release.
- Signed upload/download URLs must be scoped, short-lived, and non-public. Keep
  originals private; publishing catalog nutrition does not publish the uploader's
  identity or photos. Validate permissions again when minting download URLs.
- Do not fetch arbitrary user URLs. If remote food/image retrieval is approved,
  allowlist destinations, restrict redirects, block private/link-local/metadata
  addresses, and impose response/time limits to prevent SSRF.
- Future OCR input is untrusted. Image text cannot authorize tools, change system
  instructions, or approve catalog records; reviewers verify extracted values.

### Netlify, Neon, and release operations

- Scope Netlify runtime secrets to the backend function/service and appropriate
  deploy context. Keep production secrets out of frontend builds, untrusted PRs,
  preview deployments, build logs, artifacts, and committed netlify.toml values.
  Check built assets for secrets before release. A VITE_ value is always public.
- Backend hosting and private image storage still need an approved selection;
  Netlify frontend hosting and Neon database selection do not decide those.
- Require TLS with certificate/hostname verification for Neon clients. Use
  separate runtime and migration roles; runtime roles cannot alter schemas or
  administer accounts. Apply network restrictions where available and practical.
- Use separate environments with schema-only or clean databases and synthetic
  seeds. Do not copy production rows into a preview branch. Review connection
  pooling, connection limits, timeouts, and credential rotation for the chosen
  driver/runtime. Never disable TLS verification to fix a connection problem.
- Configure security/cache headers on API/function responses as well as static
  assets; verify deployed responses rather than assuming Netlify static header
  configuration covers every response. CORS is not access control.
- Restrict CI token permissions, pin third-party CI actions to reviewed commits,
  and prevent untrusted PR code from accessing deployment credentials. Keep
  package lockfiles, use reproducible installs, and review vulnerability findings.
- Define backup recovery objectives, retention/deletion windows, and a restoration
  drill. After restoration, reapply deletion tombstones and revoked permissions
  before serving users. Log administrative actions without sensitive payloads.
- Name an incident owner and notification decision process covering unauthorized
  disclosures as well as intrusions. Track detection, containment, rotation,
  recovery, legal deadlines, and lessons learned without exposing victim data.

### Repository exclusions and safe examples

- The root .gitignore additionally excludes local package-manager credentials,
  cloud/CLI credentials, private keys/keystores, infrastructure state, database
  backups, browser authentication state, HAR files, memory profiles, and private
  exports/test artifacts. Keep all sensitive exports, screenshots, incident notes,
  fixtures, and archives in ignored private-artifacts/, private-fixtures/,
  backups/, or exports/ folders regardless of extension. Never assume an unknown
  filename is safe because no ignore pattern matches it.
- Keep package lockfiles, reviewed migrations, synthetic seeds, public deployment
  configuration, and safe .env.example placeholders versioned. SQL ignore
  exceptions exist only for documented backend migration/seed folders; never
  place a real data dump in one of those folders. Review examples for secrets.
- Local .npmrc/.yarnrc.yml are ignored because they can hold registry credentials.
  If shared package configuration becomes necessary, create a reviewed secret-free
  example and inject credentials at runtime. Do not use ignore rules to conceal
  required application source or replace pre-commit/CI secret scanning.

### Additional official implementation references

- [OWASP ASVS stable downloads](https://asvs.owasp.org/downloads/)
- [NIST authentication guidance](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Netlify environment variables and sensitive variable policy](https://docs.netlify.com/build/environment-variables/get-started/)
- [Neon security documentation source](https://github.com/neondatabase/website/blob/main/content/docs/security/security-overview.md)
- [Neon branch documentation source](https://github.com/neondatabase/website/blob/main/content/docs/manage/branches.md)

## Original baseline references

- [OWASP Application Security Verification Standard](https://asvs.owasp.org/)
- [NIST Secure Software Development Framework, SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final)
- [FTC Cybersecurity for Small Business](https://www.ftc.gov/business-guidance/small-businesses/cybersecurity)
- [FTC Health Breach Notification Rule](https://www.ftc.gov/business-guidance/resources/health-breach-notification-rule-basics-business)
