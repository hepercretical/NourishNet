# NourishNet

NourishNet is a mobile-first calorie and macronutrient tracker for adults 18+.
This repository includes **Plan-01: Foundation and development setup**,
**Plan-02: development schema and API contracts**, and the **Plan-03 screen-design
preview and app shell**. The shell uses fictional examples to review the initial
screens. Account, tracking, scanning, upload, goal, and sharing operations are not
available in the preview. Database foundation commands run separately from the app.

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

Local review notes and the acceptance-evidence checklist are in the ignored
`Frontend/contracts/plan-03.md`. The original API check remains at
<http://127.0.0.1:5173/#/development>.

## Plan-02 development database

Read the local development data/API proposal at `Backend/contracts/plan-02.md` for the
identity/ownership contract, food/serving/nutrient model, diary snapshots, goals,
submissions, private connections, API payloads, validation, and migration order.
It links five approved, staged SQL migrations and a synthetic seed fixture.
Plan-specific contracts are intentionally ignored by Git and are available only
in the developer's local workspace.

The backend uses pinned `pg` with parameterized values, validated configuration,
and an explicit migration ledger with checksums. Only the shared foundation is
applied to the local development database. All five designs and synthetic seeds
were verified using local PostgreSQL 18.6 in a separate transaction that rolled
back. Later feature migrations are applied only when that feature is requested
and its additional decisions are approved. No new HTTP routes are implemented.

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

Install the pinned dependencies in each package:

```powershell
cd Backend
npm ci
Copy-Item .env.example .env
npm run dev
```

Leave that terminal open. In the second terminal:

```powershell
cd Frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Only copy the examples when creating a new local environment; do not overwrite
an existing `.env`. Both services also work with defaults when `.env` is absent.
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
the backend. The normal app currently makes no database requests; manual database
commands are opt-in and use the ignored backend environment.

## Local API

`npm run dev` from `Backend/` starts Node's built-in HTTP server with file watching.
`npm start` starts it without watching. The backend's database driver is `pg`;
the HTTP server and health endpoint still work without database configuration.

| Request                        | Response                                              |
| ------------------------------ | ----------------------------------------------------- |
| `GET /api/health`              | `200`, `{"status":"ok"}`                              |
| Other methods on `/api/health` | `405`, `{"error":"Method not allowed"}`, `Allow: GET` |
| Unknown route                  | `404`, `{"error":"Not found"}`                        |

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
