# NourishNet

NourishNet is a mobile-first calorie and macronutrient tracker for adults 18+.
This repository includes **Plan-01: Foundation and development setup**,
**Plan-02: development schema and API contracts**, **Plan-03: screen-design
preview and app shell**, and **Plan-04: shared food, form, and state components**. **Plans 05-07** add
local synthetic accounts, backend food queries, and an account-owned dashboard.
**Plan-08** adds live food search through a focused API client and cancellable hook.
**Plan-09** adds serving/meal selection and scaled confirmation.
**Plan-10** adds the authenticated diary API, persistent snapshots, and meal/day totals.
**Plan-11** connects the tracker to saved diaries, selected dates, and authoritative totals.
The shell uses fictional examples to review the initial
screens. Account, tracking, scanning, upload, goal, and sharing operations are not
available in the preview. Database foundation commands run separately from the app.

## Current checkout verification (November 9, 2026)

Frontend/backend lint and formatting, the frontend production build, 149 frontend
tests and 126 backend tests pass. The 31 explicit Plan-10 local integration checks
also pass. Both development services respond locally,
including the health endpoint through the frontend proxy. Open
<http://127.0.0.1:5173/#/design/components> for interactive control testing,
<http://127.0.0.1:5173/#/design> for the screen map, or
<http://127.0.0.1:5173/#/development> for the API check.

Local PostgreSQL 18.6 is now running only on 127.0.0.1:55432. The approved
foundation migration and synthetic seed were applied; all five schema designs
passed 27 integration checks in a separate transaction that rolled back. The
Plan-04 preview was opened in the default browser. No hosted services were used.

Original ignored contracts were unavailable and have been reconstructed from
source, with missing historical review evidence clearly identified.

## Tracker integration (Plan-11)

Open <http://127.0.0.1:5173/#/app/dashboard> and sign in with a fictional account.
Choose **Diary date**, then **Add food to lunch**. Search for `sample`, choose a
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

Use an actual `servingId` from `/api/foods?q=sample` and a new UUID `requestKey`
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

Open <http://127.0.0.1:5173/#/app> for the working local app. The screen-design
previews remain at <http://127.0.0.1:5173/#/design>. Use fictional input only.
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
Only 001 and 006 are persisted; later diary/submission/goal/connection migrations
remain staged. No provider, external email service, paid resource or new npm package
was added. Public deployment and production authentication review remain later work.

The authenticated GET /api/foods?q=... endpoint searches the synthetic catalog with
bound, case-insensitive literal substring matching, at most 100 query characters,
stable ordering and a fixed 25-row limit. Blank or unmatched searches return an empty
foods array. Results include serving basis, kcal, macros and nullable sodium; zero
and unknown sodium stay distinct.

### Live food search (Plan-08)

After signing in, choose **Search foods** or an **Add food** link from a meal,
or open <http://127.0.0.1:5173/#/app/search>. Type `sample` and press Enter or
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

Open <http://127.0.0.1:5173/#/design/components> or choose **Try shared food, form,
and state components** on the design map. Search for **oats**, choose the fictional
food, enter a decimal serving amount, select a meal, and choose **Confirm preview**.
Nothing is saved or sent. **Back to search** keeps both your search and serving
choices during this flow. Use fictional input only; leaving the preview resets it.

Choose **Recoverable error** or **No results** in **Preview response** to review
failure/retry and empty states. Actions pause briefly to show disabled pending
controls. Try an empty search, a zero serving, keyboard Tab/Enter, and repeated
clicks. Errors remain beside their fields or retry controls, and retry preserves
input. The estimate example displays the mathematical-estimate notice and leaves
values uncalculated pending formula review.

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

## Screen-design preview (Plan-03)

Open <http://127.0.0.1:5173/#/design> after starting the frontend. The screen map
links accounts, diary, food search/confirmation/edit/removal, scan/manual fallback,
photo submission/review, goals/history, connections/sharing, and calendars. The
footer includes settings and clearly labeled future privacy, terms, and account
rights locations. Unknown routes offer a recovery link.

Each screen has a **Preview state** selector for example, loading, error/retry,
empty, validation, and success layouts. Navigation links work; disabled operation
buttons and fields illustrate later functionality without collecting credentials,
measurements, or files. Refresh and browser back/forward retain the selected hash
route. Goal estimates are not calculated before formula approval.

For layout review, compare a narrow phone viewport (390 px) and a wide viewport
(1440 px), then check 200% zoom and keyboard access. Navigation wraps above the
screen on phones and sits beside it on wide screens. A skip link moves focus to
the main content; route changes focus the main landmark. Calendar previews offer
native month buttons and an announced day-detail list. All established design-token
values remain unchanged. The human developer reviewed and approved the mobile/wide
layouts, navigation, state patterns, and existing tokens on 2026-11-09. All three
Plan-03 acceptance criteria are complete.

The reconstructed local review summary and manual checklist are in the ignored
`Frontend/contracts/plan-03.md`. The original API check remains at
<http://127.0.0.1:5173/#/development>.

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

Open <http://127.0.0.1:5173/#/development> and click **Check API connection**. A successful
check displays "The API is running. Your local services can communicate."
Stop the backend and check again to see the persistent error and **Try again**
action. The check times out after five seconds and disables the button while pending.
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
synthetic loopback database. The design previews make no database requests.
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

## Plan-13: Goal specification

The local review specification is `contracts/plan-13.md` (intentionally ignored).
It defines the versioned adult EER formula, units, activity selection, unsupported
cases, all four objectives, explicit target/range/limit comparisons, completion,
historical versions and timezone/data-state rules. This is specification work;
the goal menu/calculator remains Plan-19. The developer explicitly delegated the
technical review to the AI and deferred independent professional review for this
internal phase; completion does not claim clinical validation or public-release
approval. No paid service was used. Keep this local contract for later implementation.
