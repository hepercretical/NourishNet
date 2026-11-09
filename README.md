# NourishNet

NourishNet is a mobile-first calorie and macronutrient tracker for adults 18+.
This repository currently implements **Plan-01: Foundation and development setup**.
The setup screen can check the local API connection. Accounts, food tracking,
database integration, and the complete app shell belong to later plans.

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

Open <http://127.0.0.1:5173> and click **Check API connection**. A successful
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

Every `VITE_` value is exposed to the browser. The backend currently has no
database client and makes no Neon connections.

## Local API

`npm run dev` from `Backend/` starts Node's built-in HTTP server with file watching.
`npm start` starts it without watching. The backend has no runtime npm dependencies.

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
the current ESLint release. No backend runtime packages are installed.

## Project guidance

Agent rules are in [AGENTS.md](AGENTS.md). Project planning, design, security,
legal, and quality guidance is in [AI_Docs](AI_Docs/). Plan-01 acceptance criteria
are in [AI_Docs/PLAN.md](AI_Docs/PLAN.md#plan-01-foundation-and-development-setup).

## License

Copyright (c) 2026 Talmage Trebilcock. All rights reserved.

This software and associated documentation files are proprietary. Distribution,
modification, commercial use, or sublicensing is strictly prohibited without
the explicit written permission of the copyright holder.
