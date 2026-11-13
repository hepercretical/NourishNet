# NourishNet

## Run and test locally

NourishNet is a mobile-first calorie and macronutrient tracker for adults 18+.
The current local build uses actual manufacturer-sourced foods, account-owned
PostgreSQL diaries, barcode lookup/camera scanning and pending photo submissions.
The new local build also includes saved calorie/macro goals, daily nutrition
summary, a goal calendar/streaks, private weight history and Preferences/themes.
Connections deliberately shows Coming Soon... as requested; functional sharing,
catalog publication and later legal/account-rights operations remain separate work.

For the existing configured checkout, start PostgreSQL and the backend:

```powershell
cd Backend
npm ci
node scripts/local-postgres.js start
npm run dev
```

In a second terminal:

```powershell
cd Frontend
npm ci
$env:VITE_AUTH_MODE = 'local'
npm run dev
```

Open <http://127.0.0.1:5173/#/app/login>. Create a private test account using a
fictional .test/.invalid address and a test-only password, verify with its code in
ignored Backend/outbox, then sign in. Existing local verification accounts and
credentials stay in ignored private-artifacts/; never copy their contents to Git.
No external authentication or email service is used in local mode.

For temporary guest testing, start the backend with `$env:LOCAL_GUEST_ENABLED = 'true'`
before `npm run dev`. In the local Vite app, choose **Continue as guest** beside
**Sign in** without filling the email/password fields. Each click after signing
out creates a separate synthetic Guest tester account with an empty diary.
The normal private API/session checks still apply. Refresh preserves the session
for up to eight hours; signing out ends access. Guest records remain in the local
database and cannot be recovered through this button. Use fictional data only.
The temporary button is included in development and production frontend builds,
including Neon Auth mode, through Sprint 3 (ending December 12, 2026). It is to
be removed afterward. Backend guest creation remains explicitly enabled per environment;
`NODE_ENV=production` does not hide or disable the requested test flow.
Unset `LOCAL_GUEST_ENABLED` and restart the backend to disable guest creation.

The hosted adapter supports guest sessions when `GUEST_TESTING_ENABLED=true` on
the synthetic testing backend. It requires the existing account/session tables
from migration `006_local_accounts.sql`, in addition to each tested feature's
migrations. Prepare and review any missing remote migrations before applying them;
no remote migration, environment change or deployment is performed by this change.
Hosted guest cookies are HttpOnly/Secure, expire after eight hours, and are
revoked on sign-out. Each guest has separate ownership; Neon sign-in still uses
its verified bearer token. The browser remembers only the explicit choice to use
a guest cookie in session storage, never the cookie/token or diary. With storage
blocked, guest access lasts for the current page but cannot resume after reload.

If a local page goes blank after formatting source files, restart Vite and reload.
The file watcher now waits for writes to finish before updating cached modules.

The root opens the real session/account flow. The old demo query switch, design
map, design examples, planned policies and unfinished routes are not application
entry points. Retired routes show Page not found with a real diary link. Design
components and their tests remain isolated in DesignPreviewApp outside this app.
Five tabs are Dashboard, Stats, Track, Connections and Preferences.

Applied local migrations are 001/002/006/008/003/009. The four actual foods are Quaker
Old Fashioned Oats (18 oz), Jif Creamy Peanut Butter (16 oz), Original Cheerios
(18 oz) and fairlife Nutrition Plan Chocolate (11.5 fl oz bottle). Old fictional foods are inactive; existing diary snapshots were retained.
A new checkout needs a separately reviewed local schema/catalog setup; do not
reseed the current database. Local commands and photo instructions appear below.

Current automated local verification covers real PostgreSQL diaries, four known
barcodes, and actual Quaker 42 oz package/label photo persistence, retries,
corrections and owner isolation. Unit/component tests are separate from explicit
local database commands. Physical-camera, phone/desktop, zoom, keyboard and
screen-reader review remains manual; CUA had no available browser/native surface.
Nothing in this local work deploys to or tests Neon/Netlify.

## Try the updated screens locally

1. Open Preferences -> Daily calorie preferences. Optionally calculate a reference
   estimate with the explained formula inputs, or enter a personal target. Choose
   a deficit, surplus or maintain comparison. Set optional macro goals in grams or
   percentages, Review goal, then Save reviewed goal. No adjustment/rate is invented.
2. Dashboard shows recorded calories, remaining/over target and macro grams for
   the selected day. View daily summary opens its nutrition totals and macro chart.
3. Stats shows the month, six exact goal/distance shades and private streak counts.
   Any saved food counts as a logged day. Select a date for its summary. Below it,
   record/edit a test-only weight, change interval/dates or display kg/lb, and inspect
   the graph/table. Missing values are not replaced with fake measurements.
4. Track offers food search or barcode scanning/manual entry. Existing known-food
   confirmation and unknown-product photo submission flows remain in place.
5. Connections is the requested Coming Soon... page. Preferences also offers the
   actual profile, submission activity under Notifications, password change, and
   saved Light/Dark plus Green/Blue/Purple/Red appearance settings. Password changes
   revoke all account sessions; use fictional test accounts/passwords only.

Goal history, weights and appearance persist in local PostgreSQL. New goals start
today or a future date. Replacing that date's goal requires explicit confirmation;
older versions remain. Weight removal retains history. Requested weight intervals
are bounded to ten years; longer histories need a reviewed pagination extension.
The calendar bands and comparison definitions are in [DESIGN.md](AI_Docs/DESIGN.md).
This local calculator uses the human-approved internal technical review; independent
professional review and public-release readiness remain later requirements.

Run `npm run verify:personal` from Backend for the explicit loopback-only check.
It preserves diaries, restores appearance, restores/tombstones its test measurement,
retains future test-goal versions in an isolated account, and rolls profile/password
checks back. Unit tests use mocks. Browser/device/zoom/screen-reader/theme review is
still manual because no CUA browser/native surface is available. Hosted adapters,
provider testing and deployment are not included or approved by this work.

## Tracker integration (Plan-11)

Open <http://127.0.0.1:5173/#/app/dashboard> and sign in with a fictional account.
Choose **Diary date**, then **Add food to lunch**. Search for `Quaker`, choose a
food, enter `1.5` servings, review, and save. The tracker returns to the same day,
showing the saved serving amount, its scaled nutrition, and updated daily totals.
For example, 150 kcal per serving contributes 225 kcal at 1.5 servings.
Unknown nutrients remain **Not provided**; display values use at most two decimals.

Refresh to reload saved entries. The selected date is remembered per account in
this tab's session storage; entries and nutrition are fetched from the API, not
stored in browser storage. If browser storage is blocked, selection still works
but refresh starts on the account's current local date. Choose a different date
to check empty-day guidance. Food saves always use the selected date, even when
it differs from today. Serving amounts follow the existing API range and precision.

Stop the backend before opening the diary to check the failed-load message and
**Try again**. Restart it and retry. A failed save keeps the confirmation and the
same request key for retry; repeated taps stay one operation. Signing out or
session expiry hides private data and cancels pending work. Reopening the diary
loads its server totals without a full page reload.

Mocked component/integration tests cover refresh/remount, account and date changes,
late responses, loading, empty days, failures/retry, successful saves, duplicates,
and snapshot contributions. Local API/proxy health and 31 real local PostgreSQL
integration checks pass. Browser automation's native connection was unavailable;
phone/wide layout, keyboard date-picker behavior, 200% zoom, and screen-reader
review remain manual checks. No new packages, API rules, or migrations were needed.

## Persistent diary API (Plan-10)

The approved `002_diary.sql` migration is applied to the local synthetic database.
On another approved local setup, run from `Backend/` after foundation/account setup:

```powershell
npm run db:migrate -- 002_diary.sql
npm run verify:diary
```

The verification command starts its own temporary API port and tests real local
PostgreSQL storage using two new fictional accounts. It retains those synthetic
accounts and diary fixtures; temporary catalog corrections roll back. It does not
print passwords or session cookies. Unit tests remain mocked and separate.

With a signed-in session, `GET /api/diary?date=2026-11-01` returns the selected
local date, its recorded timezone, four meals with entries/totals, and daily totals.
There must be exactly one `date` query field. Empty days return empty meals and
zero recorded totals; that does not mean the day is complete.

`POST /api/diary` accepts exactly these JSON fields:

```json
{
  "date": "2026-11-01",
  "servingId": "20000000-0000-4000-8000-000000000001",
  "quantity": 1.5,
  "meal": "breakfast",
  "requestKey": "30000000-0000-4000-8000-000000000001"
}
```

Use an actual `servingId` from `/api/foods?q=Quaker` and a new UUID `requestKey`
for each intentional save. Meals are `breakfast`, `lunch`, `dinner`, or `snack`;
quantity must be positive, below 100000000, and have at most four decimal places.
Send JSON from the existing local app origin. Ownership and timezone come only
from the session; client-supplied owner IDs or nutrients are rejected.
Success returns 201 with `{ date, entry }`. Retry the identical payload/key after
a connection failure: it returns the same entry, including concurrent retries.
Reusing a key with changed data returns 409. Missing servings return 404;
invalid input returns 400; expired sessions return 401. Responses are not cached.

Entries keep the food name, catalog version, serving label/grams, and per-serving
nutrition at save time. `nutrients` contains that snapshot; `contribution` contains
quantity-scaled values. Meal/day totals sum snapshot contributions, retaining all
eight product decimal places internally and returning JSON numbers. Display may
round to the existing two-decimal convention. Unknown sodium stays `null` in
contributions and any containing total; known zero stays zero. Dates are literal
local calendar dates, never UTC conversions, including DST, leap, and year boundaries.
The saved day's timezone is retained if the account timezone later changes.

All four Plan-10 criteria are verified: owner/day create/read, scaled meal/day
totals with unknown values, durable catalog snapshots, and coverage for decimal
servings, multiple meals, empty days, and local-day boundaries. For browser testing,
sign in at `/#/app`, then open `/api/diary?date=2026-11-01` on the same local host.
Use `npm run verify:diary` to exercise storage and retries independently of the tracker.

The Plan-11 repository ignore audit checked 655 representative private paths and 20
required source/example paths, with no tracked ignored files or exposed local
database password found in allowed files or the frontend build. Credential-pattern
matches were reviewed as placeholders, generated-value code, or synthetic tests.
Ignore rules cannot detect every secret embedded in an otherwise allowed file.

## Local accounts, food queries and dashboard (Plans 05-07)

Open <http://127.0.0.1:5173/#/app/login> for the working local app. Use fictional
account details and the actual manufacturer-sourced food catalog. Design previews
are isolated test fixtures and are no longer application routes.
Accounts and session records persist in the isolated local PostgreSQL database.
This is an internal development implementation, not a public authentication release.

Manual testing:

1. Choose **Create account**. Use a fictional address such as avery@example.test,
   a fictional display name, a test-only password of 15-128 characters, a valid
   timezone and the adult eligibility confirmation.
2. Open the newest matching verification message in the ignored Backend/outbox
   folder. Copy its code into **Verify email**, then sign in. No external email is
   delivered. Codes expire after 30 minutes and can be used only once; request a
   new code if needed.
3. Review your private daily nutrition summary and Breakfast, Lunch, Dinner and
   Snack sections. New diaries show zero recorded totals, no goal and useful empty
   states. Sharing is off. Add-food links open live search and save to the selected diary date.
4. Sign out, create and verify a second fictional account, then sign in. Check its
   name/timezone and confirm the previous account content is cleared. Sessions
   expire after eight hours; expired sessions ask you to sign in again.
5. Use **Forgot password**, open the matching recovery message in Backend/outbox,
   and enter its code and a replacement test-only password. Reset revokes earlier
   sessions. Confirm the old password fails and the replacement works.
6. Check Tab/Enter, pending buttons, invalid/expired codes, short passwords,
   invalid fictional email, and recovery after stopping/restarting the backend.
   Review phone/wide layout and 200% zoom. Human visual review is still required.

Passwords are salted scrypt hashes; cookies are HttpOnly and SameSite=Strict.
Verification, recovery and session tokens are hashed in PostgreSQL. Plain delivery
codes exist only in the ignored local outbox. Never commit or share that folder,
Backend/.env, database data, browser sessions or private testing artifacts.

The approved account schema is migration 006_local_accounts.sql, applied after 001.
The current local schema also includes approved diary 002, catalog 008 and submission
003 migrations. Goal/connection migrations remain staged. Account setup added no
provider or external email service. Public deployment and production authentication
review remain later work.

The authenticated GET /api/foods?q=... endpoint searches the active actual-food catalog with
bound, case-insensitive literal substring matching, at most 100 query characters,
stable ordering and a fixed 25-row limit. Blank or unmatched searches return an empty
foods array. Results include serving basis, kcal, macros and nullable sodium; zero
and unknown sodium stay distinct.

### Live food search (Plan-08)

After signing in, choose **Search foods** or an **Add food** link from a meal,
or open <http://127.0.0.1:5173/#/app/search>. Type `Quaker` and press Enter or
choose **Search foods**. Results show each food's name, serving basis, calories,
protein, fat, carbohydrates, and sodium. Unknown sodium reads **Not provided**.
Search runs only on submission or retry, not while typing or rendering. Blank
and overlong input receive field feedback; the maximum is 100 characters.

Try an unmatched name to see the no-results guidance. Stop the local backend,
submit a search, then restart it and choose **Try again** to repeat the failed
term. The input stays available for correction. Pending searches disable repeat
submission, clear old results, and announce loading. Navigation, logout, or session
expiry cancels pending work; late responses cannot repopulate the old screen.
Choose a result to open the serving and meal flow described below.

Mocked client, hook, component, and signed-in route tests cover delayed/failing
requests, cancellation, stale responses, empty results, retry, and keyboard
submission. The existing local API/database integration script passes 33 checks.
Browser automation was unavailable during Plan-08 verification; phone/wide layout,
screen-reader behavior, and zoom still need human review.

The Plan-09 ignore-rule audit checked 472 private paths across root, Frontend,
Backend, and nested folders, plus 13 required source/example/lockfile/migration/seed
paths. Added exclusions cover additional credential stores, Terraform plan files,
and shell histories. No tracked file matches an ignore rule. Credential-pattern
matches were reviewed as safe placeholders, generated-value source, or synthetic
test URLs. These checks reduce risk and cannot guarantee that every future filename
or embedded secret is excluded. Nothing was staged or committed.

### Add food to a meal (Plan-09)

Sign in to the local app, choose **Add food to lunch**, search for `sample`, and
choose a food. The meal shortcut preselects Lunch; the general search link asks
you to choose a meal. Enter `1.5` servings and choose **Review entry**. Confirmation
shows the food, serving basis, amount, meal, and scaled calories, macros, and sodium.
For example, 150 kcal per serving becomes 225 kcal for 1.5 servings. Unknown sodium
stays **Not provided**, while known zero stays zero. Calculations retain precision;
confirmation and session cards show at most two decimal places.

Choose **Edit serving and meal** to revise your choices, or **Back to search** from
the form to keep the query, results, and draft for the selected food. Blank, zero,
negative, nonnumeric, and nonfinite amounts receive field feedback. Amounts whose
nutrition would overflow receive a recovery message. Choose **Save entry** to return
to the diary with success feedback and one entry in the selected meal. Repeated
taps stay one operation; deliberately starting a new entry allows another serving.

Plan-11 now saves these entries through the approved Plan-10 API. The tracker reloads
the selected day and its totals after saving and on refresh. Signing out hides the
private diary; signing back in reloads saved entries.

Mocked component and integration tests cover keyboard selection/submission, decimal
scaling, validation, editing, retained search/drafts, failed/pending saves, retry
identity, duplicate taps, meal placement, local-day filtering, and logout/expiry.
The frontend has 143 passing tests; the backend has 85, with 33 additional explicit
local integration checks. Browser automation could not connect to this machine;
phone/wide layout, 200% zoom, and screen-reader review remain manual checks.

From Backend, run npm run verify:accounts for explicit local integration checks.
It creates two uniquely named fictional account fixtures, checks verification,
login, logout, recovery/reset, expiry, owner isolation and catalog responses, and
rolls back temporary catalog fixtures used to verify the result bound. It never
prints credentials or codes. Unit tests mock repositories and never contact Neon.

## Shared controls (Plan-04)

The shared-control examples and their automated tests remain in the isolated
design harness. They are not reachable from the application and do not supply
application foods, diary entries or fake success responses.

Reusable controls live in their own folders, such as
`Frontend/src/components/FoodCard/FoodCard.jsx`, with tests beside each component.
Import shared controls from `Frontend/src/components/shared/index.js`, or import
the component directly; both include the common shared CSS. `SearchForm` takes controlled
`query`/`onQueryChange` props and an `onSearch(text)` callback. `ServingMealForm`
takes controlled `draft`/`onDraftChange` props, a serving basis, and an
`onSubmit({ amount, meal })` callback. Parent screens own drafts so validation,
retries, and step navigation can preserve input. Callbacks may return promises;
forms prevent overlapping submissions, show pending feedback, and replace thrown
errors with product messages. Backend idempotency and persistence belong to later
feature plans. `FoodCard`, `NutritionFacts`, `EstimateSummary`, `Notice`,
`PendingStatus`, `LoadingState`, `EmptyState`, `ErrorState`, `FormField`,
`ServingInput`, `MealSelect`, and `Button` can also be used separately.

Nutrition presentation keeps supplied precision, shows kcal/g/mg, and displays
missing values as **Not provided**. These controls perform no nutrition scaling
or goal calculations. Existing design tokens are used unchanged.

## Design reference components

Initial screen designs remain in source and the isolated DesignPreviewApp test
harness for reference. The normal app has no design-preview route or fixture
transport, even when a legacy demo query flag is present. Implemented flows are
reviewed directly through the local account app. Human visual/device review
remains separate from automated component tests. Established tokens are unchanged.

## Plan-02 development database

Read the reconstructed local data/API contract at `Backend/contracts/plan-02.md` for the
identity/ownership contract, food/serving/nutrient model, diary snapshots, goals,
submissions, private connections, API payloads, validation, and migration order.
It links the five existing staged SQL migrations and synthetic seed fixture.
Unavailable original future endpoint payloads are not reconstructed as new approvals.
Plan-specific contracts are intentionally ignored by Git and are available only
in the developer's local workspace.

The backend uses pinned `pg` with parameterized values, validated configuration,
and an explicit migration ledger with checksums. The repository records earlier
local PostgreSQL 18.6 verification: only the shared foundation was persisted;
all five designs and synthetic seeds were also checked in a transaction that
rolled back. This checkout has now repeated the local foundation setup and all 27 rollback
verification checks successfully. Later feature migrations are applied only when that feature is requested
and its additional decisions are approved. Plans 05-07 add the approved local
account, catalog-query and dashboard routes described above.

The developer selected **local PostgreSQL only**. No Neon/Netlify resources or
connections were created. Hosted database verification is not claimed. For a
future approved remote backend target, the driver requires TLS certificate
verification; connection secrets remain backend-only. Development, preview and
production must use separate data and credentials. Runtime health/startup does
not open a database connection or apply migrations.

For optional local database setup, obtain the PostgreSQL Windows binary archive
from the [official download page](https://www.postgresql.org/download/windows/)
and extract its `pgsql/bin`, `pgsql/lib`, and `pgsql/share` folders under the ignored
`.tools/postgresql/` directory. The local helper uses these portable binaries;
it does not install a Windows service or require a hosted subscription.
From `Backend/`, on a fresh setup with **no existing `.env`**:

```powershell
node scripts/local-postgres.js init
node scripts/local-postgres.js start
npm run db:check
npm run db:migrate -- 001_identity_catalog.sql
npm run db:seed
npm run db:migrate -- 006_local_accounts.sql
npm run db:verify
```

Initialization generates a random password and an ignored backend `.env`; it
refuses to overwrite existing environment/data files. If `.env` already exists,
preserve it and configure the database settings shown in `.env.example` instead.
The helper's start/stop commands manage only the cluster it initialized. The local
server listens only on `127.0.0.1:55432`. Stop it when finished:

```powershell
node scripts/local-postgres.js stop
```

Migration commands require a pinned expected host/database, `DATABASE_ENV=development`
and `DATABASE_SYNTHETIC_ONLY=true`. The migration filename must be on the approved
list; there is no automatic “apply all” command. Reapplying unchanged SQL is a no-op;
checksum drift fails. Seeding is explicit and refuses duplicate data rather than
overwriting it. `db:verify` runs only on the dedicated loopback development target;
it validates all schema designs with synthetic data and rolls back its work.
The local setup uses a local cluster-owner credential for these manual commands;
it is not a production runtime-role configuration.

## Prerequisites

- Node.js **24.x** and npm (verified with Node 24.21.0 and npm 11.19.0).
- Two terminal windows, starting at the repository root.
- No Neon account, database, hosting subscription, or credentials are required
  for Plan-01.

## First-time local setup

Install the pinned dependencies in each package. For the working local account app,
first complete the portable PostgreSQL setup above, including migrations 001/006
and the synthetic seed. Preserve the generated Backend/.env; do not overwrite it
with the placeholder example. Then start the backend:

```powershell
cd Backend
npm ci
node scripts/local-postgres.js start
npm run dev
```

Leave that terminal open. In the second terminal:

```powershell
cd Frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Only copy frontend examples when creating a new local environment; do not overwrite
an existing `.env`. The health endpoint and design previews work without database
configuration; the working account app requires the approved local database setup.
On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. On macOS/Linux, use
`cp .env.example .env` in place of `Copy-Item`.

Open <http://127.0.0.1:5173/#/app/login>. To inspect process health directly,
request <http://127.0.0.1:3001/api/health> or the proxied
<http://127.0.0.1:5173/api/health>. Health is not a database/feature check.
Stop development services with Ctrl+C in each terminal.

Vite forwards `/api` requests to <http://127.0.0.1:3001> during development.
This proxy is local development configuration, not production backend hosting.

## Environment variables

| Package  | Variable            | Default     | Purpose                                        |
| -------- | ------------------- | ----------- | ---------------------------------------------- |
| Backend  | `HOST`              | `127.0.0.1` | Local API bind address                         |
| Backend  | `PORT`              | `3001`      | Local API port (integer 1–65535)               |
| Frontend | `VITE_API_BASE_URL` | `/api`      | Public API prefix used by the connection check |

Keep the default backend port for the existing Vite proxy. If changing it,
update `server.proxy` in `Frontend/vite.config.js` to match. Restart the services
after changing environment configuration. For local development, use the proxy
instead of a cross-origin API URL; CORS is not configured in this foundation.

Every `VITE_` value is exposed to the browser. Database settings belong only in
the backend. The local account app calls the backend API, which accesses only the configured
synthetic loopback database. The isolated design-test harness makes no database requests and is not an app entry point.
Manual migration/verification commands are explicit and use the ignored backend environment.

## Local API

`npm run dev` from `Backend/` starts Node's built-in HTTP server with file watching.
`npm start` starts it without watching. The backend's database driver is `pg`;
the HTTP server and health endpoint still work without database configuration.

| Request                        | Response                                              |
| ------------------------------ | ----------------------------------------------------- |
| `GET /api/health`              | `200`, `{"status":"ok"}`                              |
| Other methods on `/api/health` | `405`, `{"error":"Method not allowed"}`, `Allow: GET` |
| Unknown route                  | `404`, `{"error":"Not found"}`                        |

The local account app also uses POST `/api/auth/signup`, `/verify`, `/resend`,
`/login`, `/logout`, `/recover`, and `/reset` under `/api/auth`; GET
`/api/auth/session`; and authenticated GET `/api/foods` and `/api/dashboard`.
Mutation requests must come from `http://127.0.0.1:5173` and contain JSON.
Verification/recovery use the ignored local outbox. Session cookies are set by
login and cleared on logout or expiry; session tokens are never returned in JSON.

All responses are JSON with `Cache-Control: no-store`. Health reports only that
the process can respond; it does not claim database, authentication, or deployment readiness.

To check directly in PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

## Quality checks

### Local catalog preparation (Plan-14A)

From `Backend/`, preview the proposed actual-food catalog without opening a database:

```powershell
npm run catalog:plan
```

The proposal contains manufacturer nutrition/source links, barcode mappings and
SHA-256 checksums for `migrations/008_actual_food_catalog.sql` and
`catalog/manufacturer-foods.json`. These files are prepared for review; their
presence does not mean the local schema or catalog has been updated.

With the existing local PostgreSQL cluster running, inspect migration history and
catalog/diary counts without changing records:

```powershell
npm run catalog:inspect
```

The inspector accepts only `127.0.0.1:55432/nourishnet_plan02_dev` with the existing
development confirmations. It rejects hosted databases before opening a connection.
The proposed migration retains existing foods/servings and diary snapshots while
marking fictional foods inactive; the import adds three source-backed foods without
overwriting existing records. No catalog operation runs during startup or build.

To repeat the approved local API/database integration checks against those actual
foods and the same two isolated test accounts:

```powershell
npm run verify:catalog
```

This explicit local command exercises all meals, decimal totals, retries, edits/
removal, account separation and date boundaries. It preserves existing diaries
and stores test credentials/results only under ignored `private-artifacts/`.
Manual browser/phone review is separate from these automated checks.

### Package checks

Run from `Frontend/`:

```powershell
npm run format
npm run lint
npm test
npm run build
npm run format:check
```

Run from `Backend/`:

```powershell
npm run format
npm run lint
npm test
npm run format:check
```

Tests run once and exit. Frontend tests use Testing Library and userEvent with
mocked fetch responses; backend tests use an ephemeral loopback HTTP port.
Neither suite connects to Neon. The frontend build goes into ignored
`Frontend/dist/`; source maps are disabled. `npm run preview` from `Frontend/`
serves those assets locally; Vite's development API proxy is not a production API
deployment.

`npm ci` provides repeatable installs from the package lockfiles.
The root `.gitignore` excludes local environments, dependencies, builds,
databases, and uploads while allowing safe `.env.example` files.

Dependency note (2026-11-09): npm reports four moderate development-tool advisories
through ESLint 10's `minimatch` dependency (GHSA-g3hv-75wg-m249). npm's suggested
ESLint 9 downgrade is marked unsupported by its publisher, so this scaffold keeps
the current ESLint release. Plan-02 adds the approved `pg` runtime dependency.

## Project guidance

Agent rules are in [AGENTS.md](AGENTS.md). Project planning, design, security,
legal, and quality guidance is in [AI_Docs](AI_Docs/). Plan-01 acceptance criteria
are in [AI_Docs/PLAN.md](AI_Docs/PLAN.md#plan-01-foundation-and-development-setup).

## License

Copyright (c) 2026 Talmage Trebilcock. All rights reserved.

This software and associated documentation files are proprietary. Distribution,
modification, commercial use, or sublicensing is strictly prohibited without
the explicit written permission of the copyright holder.

## Plan-12: Edit and remove diary entries

In `#/app/dashboard`, choose a diary date, then **Edit [food name]**. Change the
positive serving amount (up to four decimal places) and meal, review the scaled
nutrition, and choose **Save changes**. **Cancel** keeps the original entry.
**Remove [food name]** identifies the entry and requires **Confirm removal**.
Meal lists and totals reload from the backend after a successful change.
A failed change keeps choices for retry. A stale or unavailable entry requires
cancelling and **Reload diary**, followed by a new review. A failed totals reload
after a confirmed change retries the read without repeating the mutation.

The human-approved contract adds PATCH/DELETE `/api/diary/entries/:id`. PATCH JSON:
`{date, quantity, meal, revision, requestKey}`; DELETE JSON:
`{date, revision, requestKey}`. Reads include entry revision. Both return 200 JSON,
require the authenticated owner, matching local date and configured Origin, and
preserve nutrition snapshots. Stale revision/key reuse conflicts return 409;
missing and other-owner entries return 404. Retried identical requests replay one
transaction. Existing schema is used; no migration or dependency was added.

## Netlify release preparation

The root `netlify.toml` uses repository root as its base, installs `Frontend/` and
`Backend/` from their lockfiles, runs `npm run build:hosted`, and publishes
`Frontend/dist` plus `netlify/functions` using Node 24. The modern API function
handles `/api/*` on the site's own origin. Hash routes need no SPA catch-all.
Git-triggered builds are skipped by default; keep the dashboard's builds stopped.

The GitHub Actions **Prepare sprint release** workflow is manually started from
the Actions tab once these files have been committed and pushed. It runs both
packages' checks, builds hosted mode, and saves a frontend review artifact labeled
with the commit SHA for one day. Its manual form includes the public Auth URL,
defaulting to the linked synthetic Neon target; review it before starting. No
GitHub credential or environment-variable setup is needed. It never deploys, applies SQL,
or reads database/Netlify credentials. The static review artifact alone does not
contain Functions: publish the reviewed full source/build through Netlify CLI
with function packaging, not a drag-and-drop of only the frontend artifact.

The human linked `thenourishnet.netlify.app` to GitHub and reported stopped builds,
a successful initial deploy, and 285 Free credits remaining on November 11. Confirm
the existing site ID in Project configuration; do not create a duplicate. Link it
with `netlify link --id <confirmed-site-id>` once CLI authentication works. Keep
account credentials and local `.netlify` configuration out of Git.

Connection status checked November 12: both CLIs are authenticated and the existing
site is linked locally (ID `a91beb07-fd40-4ea5-a7f4-7e8c0fd92464`). The approved
Neon migrations 001, 002 and 007 and the existing synthetic seed have been applied.
Migration checksums and counts were verified: two foods, two serving records,
two fictional non-login identities, and no hosted profiles. The hosted backend
successfully reads both sample foods through Neon's pooled connection.
The frontend and `/api/*` Function were published together on November 12 at
`https://thenourishnet.netlify.app` (deploy `6af64fe5b2a0af4e489c21a1`). The first
local build failed because Vite locked a native dependency; stopping the local
server allowed the second attempt to succeed. External HTTP checks encounter
Netlify's login protection, so open the site in a browser signed into the allowed
Netlify account to test it. Hosted authenticated diary journeys remain unverified
while tester emails are deferred.
Netlify Free uses all environment scopes; the developer approved that adjustment
on November 12. The database URL is available to controlled builds and server
runtime, but is never a `VITE_` variable or browser asset. No upgrade is needed.
The human confirmed Auth is enabled with required email verification codes and
the Netlify domain is trusted. Existing local synthetic-account mode still works;
hosted mode uses Neon Auth and an approved tester allowlist. Auth service accounts
alone do not grant diary access. Profile onboarding requires adult confirmation.
Netlify CLI 27.16.0 works; 27.17.0 could not resolve `@babel/types@^7.29.14`
from npm. Use the working version for this release. No duplicate site was created.
The tester-email allowlist was
deferred at the developer's request: signed-in diary access stays denied until
`NEON_TEST_EMAILS` is configured. Local synthetic testing remains available.

### Environment configuration

Configure these directly in Netlify; do not send private values in chat or commit
them. The table identifies consumers; Free stores them across all scopes in the
production context, rather than enforcing the consumer scopes separately:

| Name                      | Where used         | Value/purpose                                                             |
| ------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `VITE_NEON_AUTH_URL`      | Build, public      | Exact branch Auth URL ending in `/neondb/auth`                            |
| `APP_ORIGIN`              | Functions          | `https://thenourishnet.netlify.app`                                       |
| `NEON_AUTH_BASE_URL`      | Functions          | Same Auth URL; used for JWKS and issuer/audience checks                   |
| `NEON_TEST_EMAILS`        | Functions, private | Comma-separated explicitly approved tester mailboxes; empty denies access |
| `DATABASE_URL`            | Functions, secret  | Pooled connection string for the approved synthetic Neon target           |
| `DATABASE_EXPECTED_HOST`  | Functions          | Exact hostname from that connection string                                |
| `DATABASE_EXPECTED_NAME`  | Functions          | Exact database name from that connection string                           |
| `DATABASE_ENV`            | Functions          | `development` for the current synthetic internal build                    |
| `DATABASE_SYNTHETIC_ONLY` | Functions          | `true`                                                                    |

Use the production deploy context only for this site's approved internal target.
Do not grant untrusted PRs/preview builds access to these secrets. The hosted build
forces `VITE_AUTH_MODE=neon` and fails if the public Auth URL is absent. Never put
`DATABASE_URL`, tokens, or service credentials in any `VITE_` variable. `.env.example`
files document local setup; backend development commands load `Backend/.env`.
For local hosted-Auth testing, add the exact local app origin to Neon's allowlist
(`127.0.0.1` is different from `localhost`) and use a separate synthetic target.

### Database and sprint release sequence

1. Read actual provider plans/usage and the approval/budget rules in AGENTS.md.
   Copy `scripts/release-budget.example.json` into ignored `private-artifacts/`,
   fill current numbers and estimates, then run
   `npm run release:plan -- private-artifacts/<budget-file>.json` from root.
   Unknown values deliberately fail; the calculator never deploys or loads secrets.
2. Inspect the target's existing tables and migration history using authenticated
   tools. Initial hosted dependencies are migrations 001, 002 and the new 007;
   ask for approval of the exact pending SQL/checksums. Do not blindly apply every
   migration or overwrite an existing schema. Migration 006's local password
   tables are not required by hosted Auth. Migrations 001, 002 and 007 were applied
   with explicit approval during initial setup; do not seed this target again.
   `npm run release:database-plan -- 001_identity_catalog.sql 002_diary.sql 007_hosted_profiles.sql`
   prints the local filenames/checksums for that review without opening a database.
3. After that specific approval, use
   `node Backend/scripts/neon-database.js <ignored-env-file> <approved-direct-host> migrate <filename>`
   for each approved pending migration against the confirmed synthetic target, then
   validate the schema. Seed reviewed synthetic foods only once with approval;
   never seed/reset an existing live catalog as part of a deploy.
4. Run `npm run release:check` from root, then build hosted mode with the public
   Auth URL supplied privately in the process environment: `npm run build:hosted`.
   The manual GitHub workflow provides the same review checks after source is pushed.
5. Review commit/artifact, migration results, access scope and current budget with
   the human. After approval of that one publish, run a compatible Netlify CLI's
   `netlify deploy --build --prod --site <confirmed-site-id>` from root. Keep hosted
   automatic builds stopped. Do not upload the repository or `.env` as static files.
6. Verify `/api/health`, sign-up/code/sign-in/profile setup, search/add/edit/remove,
   refresh, logout, and isolation between two approved test accounts. Record credit
   usage and failures. Mocked test success is not a hosted end-to-end pass.

The Neon recovery-code adapter uses the installed SDK's email-OTP methods; remote
mail delivery/recovery and browser cookie compatibility still need verification.
Realtime is enabled in Neon but is not subscribed to by the diary. Do not expose
private diary subscriptions until account-scoped authorization is implemented and
tested. No database migration or service-policy deploy happens in the build pipeline.

## Plan-13: Goal specification

The local review specification is `contracts/plan-13.md` (intentionally ignored).
It defines the versioned adult EER formula, units, activity selection, unsupported
cases, all four objectives, explicit target/range/limit comparisons, completion,
historical versions and timezone/data-state rules. This is the historical
specification. The current local calculator retains its formula/input/notice
rules; DESIGN.md supersedes its explicit-completion and outcome-comparison rules. The developer explicitly delegated the
technical review to the AI and deferred independent professional review for this
internal phase; completion does not claim clinical validation or public-release
approval. No paid service was used. Keep this local contract for later implementation.

## Local barcode lookup and scanner

Sign into the local app at `http://127.0.0.1:5173/#/app/login`, then use the
toolbar barcode shortcut or **Track -> Scan barcode or enter barcode number**. Enter a printed
barcode, or choose **Start camera** and allow video capture. The camera stops on
the first decoded result; review servings and meal before **Save entry**. Manual
entry remains available if camera access or decoding fails. No video is uploaded.

The current local catalog recognizes these exact product barcodes (other package
sizes/product versions can have different codes):

Added November 13 from the user's package/label photos, cross-checked against
the manufacturer: fairlife Nutrition Plan Chocolate, 11.5 fl oz / 340 mL, single
bottle UPC **811620022118** (GTIN14 `00811620022118`). The supplied ten middle
digits `1162002211` omit the printed outside digits; manual entry needs the full
12-digit code. One bottle is 150 kcal, 30 g protein, 4 g carbohydrate, 2.5 g fat and
230 mg sodium. Volume is not treated as a known gram mass. Scan or enter the full
code, confirm servings/meal, then Save entry. `npm run verify:fairlife` from
Backend verifies this record through the real local Vite proxy and restores its
test diary entry. No existing food or diary record was overwritten.

- Quaker Old Fashioned Oats, 18 oz: `030000010204`.
- fairlife Nutrition Plan Chocolate, 11.5 fl oz bottle: `811620022118`.
- Jif Creamy Peanut Butter, 16 oz: `051500255162`.
- Original Cheerios, 18 oz: `016000170032`.

The approved local `GET /api/foods/barcode?code=...` endpoint validates 8/12/13/14
digits and their check digit, pads canonical IDs to 14 digits, and returns actual
active catalog servings or an explicit unknown result. UPC-E is not expanded;
enter the full UPC-A instead. Lookup never writes a diary/catalog record.
Check-digit rules follow [GS1](https://www.gs1uk.org/knowledge-hub/standards/what-is-a-check-digit).

The updated camera requests a 1920×1080 rear-camera stream when available and
continuous focus only on devices that support it. Pixel decoding explicitly
handles horizontal/vertical and reversed retail barcodes in rectangular frames.
It samples a bounded set of rows across the preview instead of scanning every
row on unreadable frames. Fatal decoder failures show recovery instead of leaving
an apparently active preview; after eight seconds the screen offers focus,
lighting and manual-entry guidance. Keep the entire barcode and its blank end
margins visible. A clear, close-up image works better than the whole bottle.
Decoded pixels stay on-device. There is no automatic internet-wide product lookup:
known reviewed catalog products open serving/meal review, then Save entry logs
the food once. Unknown products still offer pending photo submission.

Regression checks use real ZXing decoding on generated UPC pixel frames (four
orientations, off-center placement, reduced contrast, noise, blank/bad-checksum
frames and a second product), plus mocked camera lifecycle and scanner UI tests.
These tests do not establish a physical-camera or supplied-photo decoding pass;
actual webcam/phone focus, glare and bottle curvature still need manual testing.

From Backend, `npm run verify:barcodes` runs the local Vite-proxied lookup checks
using the existing verification accounts and confirms catalog/diary counts stay
unchanged. No provider is contacted. The decoder is bundled from the approved,
pinned ZXing packages; physical-phone camera quality/compatibility still needs
manual testing. Camera capture needs a browser-approved secure context; loopback
is supported for desktop local testing. Do not expose the local servers publicly
or deploy to obtain a camera test URL without approval.

## Local unknown-product photo submissions

When a barcode is unknown, choose **Submit package and label photos**. Upload the
package front and nutrition label (JPEG/PNG/WebP, at most 5 MB each). Product name,
serving text and label nutrients are optional; leaving values blank does not turn
them into zero. Submit once, then open **Menu -> My submissions** for persisted
status and the uploaded images. A submission stays pending and is not searchable
food or a diary entry. Review/publication is a later feature.

Requested corrections become editable only when status is **Changes requested**.
Existing photos can be retained while correcting fields, or replaced. A correction
returns to pending. The local API supports authenticated create/list/detail/photo/
correction routes under `/api/submissions`; repeat saves replay an actor-scoped
key, and concurrent/stale/conflicting changes do not silently overwrite records.

The human-approved local migration `003_submissions.sql` was applied November 12.
Generated image files live under ignored `Backend/uploads/submissions/`, outside
static assets; images are retrieved through owner-only endpoints. Production
upload hardening and retention remain in the later phase. No hosted storage or
submission service was configured or tested.

From Backend, `npm run verify:submissions` uses the existing two test accounts and
the actual Quaker 42 oz images under ignored `private-artifacts/package-photos/`.
It retains one test submission, checks exact bytes, duplicates/retries, ownership
and requested correction, and leaves food catalog/diary counts unchanged. It does
not invent a product or publish submitted data. A fresh checkout needs its own
actual package images and approved local test setup before running that command.

## Manual local acceptance checklist

Use the local account app, not a design harness. This checkout still needs human
webcam/phone, desktop/mobile layout, keyboard, zoom and screen-reader review.

1. Sign in, search Quaker, choose 1.5 servings for Lunch and save. Refresh and
   sign out/in; confirm the selected date, saved entry and totals. Edit its meal/
   quantity, then remove only your test entry and confirm totals recover.
2. Open the barcode shortcut. Enter `030000010204`, confirm serving/meal and save
   once. Try rapid repeated saves and a retry; confirm one entry.
3. Start the camera, scan a supported real product and confirm the match before
   saving. Leave the scanner and confirm the camera indicator stops. Deny camera
   permission and verify manual entry still works. Physical-phone decoding remains
   unchecked until performed on a suitable local device setup.
4. Enter unknown catalog barcode `030000010402` (Quaker 42 oz), choose package/
   label photos, navigate back and return, then submit. Actual manufacturer image
   files used in automated local checks are under ignored
   `private-artifacts/package-photos/quaker-front.jpg` and `quaker-label.jpg`.
5. Open My submissions, refresh and check pending status and both photos. Another
   account must not see the submission. Correction controls appear only for
   actual Changes requested records; reviewer/publication controls are not in scope.
6. Check the toolbar, five bottom tabs, Preferences, keyboard focus, narrow layout
   and 200% zoom. No design map, demo, fake profile, planned policy or future-feature
   destination should be exposed by the normal app. Retired direct routes recover
   through Page not found. Loading, empty, error and pending-review copy should stay.

See AI_Docs/PLAN.md for checked local acceptance criteria and remaining explicit
human/device checks. Hosted acceptance uses the authorized local substitute for
now; no provider push/test/deploy is implied.
