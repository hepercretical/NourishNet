# AGENTS.md

## Your Role

You are a React developer on this project titled **NourishNet**. You write clean,
tested React code that interacts with a database, and you explain every change to
whoever you are working with in simple words.

## What is NourishNet?

NourishNet is a mobile-first web app that helps people track their daily calories
and macronutrients: fat, protein, and carbohydrates. A user can log food under
Breakfast, Lunch, Dinner, or Snack. Food can be searched in a nutrition database,
and its calories, serving size, macros, and useful additional facts such as sodium
can be added to the user's daily totals.

The app will also support scanning a food product barcode. When a barcode is not
in the database, the user can submit a photo of the package front and a photo of
the nutrition label. If practical, a later version may use OCR to read the label
and prepare a food record for review before it is added to the database.

The public product is for adults aged 18 and over. Accounts support private food
diaries and goals for gaining, losing, or maintaining weight, with muscle gain
as an additional objective. A guided menu estimates goals using biological sex,
height, weight, and age, with any additional formula inputs explained. Explain
why sensitive inputs are needed; never infer biological sex from a name or gender
identity. Do not collect more precise personal data than the approved calculation
requires.

All suggestions must clearly say they are estimates based on mathematical
formulas and are not professional medical advice or diagnosis. Put this notice
beside the estimate and before saving it, not only in legal pages. Document the
formula, units, assumptions, limitations, and version. Formula selection, activity
assumptions, safety limits, unsupported populations, and goal-completion rules
require human approval and qualified review before implementation. Do not invent
clinical thresholds or promise weight or muscle outcomes.

Users can request and accept private connections to keep each other accountable.
Sharing is off by default and requires explicit selection of goal progress to
share with accepted connections. Body measurements, biological sex, age, and
detailed food logs remain private. Users can revoke sharing, remove connections,
block users, and report abuse. A simple calendar compares each person's recorded
progress against their own goal effective on that day. Missing, incomplete,
private, and unavailable data must not be presented as a failed goal. Do not add
public profiles, open follows, messaging, or leaderboards without approval.

Known barcode products enter a short serving/meal confirmation flow so logging
is fast and intentional. Repeated camera detections and retries must not create
duplicate entries. Submitted photos and nutrition data require review before
becoming reusable catalog records; OCR remains a separately approved enhancement.

Only work on the plan that has been requested, or on work specifically requested
by the human developer. Later plans may depend on earlier plans, so do not pull
future features into an earlier plan without approval.

If the project needs clarification, or if AGENTS.md needs to be added to or
modified in any way, the clarification or approval must come from the human
developer. Do not infer permission to change this file from a general coding
request.

This documentation update was explicitly requested by the human developer.
Every future AGENTS.md addition, edit, or removal requires explicit approval from
a human developer for that change; an automated agent or general feature request
cannot grant that approval.

## AI_Docs requirements

### Human-approved delivery schedule (2026-11-09)

Sprint 1 runs November 1-14, 2026; Sprint 2 runs November 15-28; Sprint 3 runs
November 29-December 12. Complete initial design and functionality by the end of
Sprint 3 Week 1 (December 5). Reserve December 6-12 exclusively for final bug
fixes, regression tests, and quality checks; do not schedule new features then.

Implementation and verification of SECURE.md and LEGAL.md requirements are
required only after Sprint 3, starting December 13, as scheduled in AI_Docs/PLAN.md.
This timing governs security/legal requirements repeated in the other guidance
documents; they are not acceptance gates for the internal feature milestone.
Read those documents for context and keep their requirements for the later phase.
The existing AGENTS.md rules still apply, including secret protection, backend-only
Neon access, parameterized SQL, synthetic development data, approval boundaries,
adult product scope, formula review, and the mathematical-estimate notice. Keep
existing safeguards and .gitignore entries. Sprints 1-3 use an internal development
version with synthetic accounts/data and sample uploads; public launch and real-
user onboarding require the later security/legal implementation and release gate.

- Before working on any project area covered by documentation in `AI_Docs/`,
  inspect that folder and read every applicable `.md` file in it.
- The complete set of current project guidance is the `.md` content in
  `AI_Docs/`; do not use only one document when several apply to the requested
  work. For example, planning work may require `AI_Docs/PLAN.md`, UI work may
  require `AI_Docs/STYLE_GUIDE.md`, and database or deployment work may require
  `AI_Docs/SECURE.md` or `AI_Docs/LEGAL.md`.
- Treat all applicable `AI_Docs/*.md` instructions as required project
  requirements alongside AGENTS.md. Resolve conflicts by stopping and asking the
  human developer for clarification; do not silently choose an interpretation.
- If an applicable `AI_Docs` document is missing, unclear, or appears out of
  date, ask the human developer before proceeding with work that depends on it.
- Do not modify, add, or remove files in `AI_Docs/` unless the human developer
  explicitly requests or approves that change.

## Commands

Run these from `Frontend/` after the Vite app has been scaffolded:

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run format
```

Run these from `Backend/` after the server package has been scaffolded:

```bash
npm ci
npm run dev
npm run lint
npm test
npm run format
```

If a command is not available yet, add the matching package script as part of the
scaffolding plan instead of silently substituting an unrelated command.

### Dependency and setup rules

- Use `npm ci` for repeatable installs from each package's lockfile. Use
  `npm install` only for human-approved dependency changes, and retain the
  resulting lockfile.
- Do not run `npm audit fix --force`. Review a supported upstream fix before
  updating dependencies; do not automatically adopt an unsupported downgrade
  suggested by an audit tool.
- Do not edit README.md in future work. Preserve its completed class-reflection
  template and content.
- Do not edit sprint_time_log.md in future work. Preserve its existing content.
- Update AI_Docs/TIME_LOG.md every day that NourishNet work is performed on the
  current computer, keeping it current at the end of each work session. Include
  all project work done on that computer during the day, across sessions, with
  one daily total followed immediately by a breakdown of the steps or parts
  worked on and the time spent on each. Use America/Denver dates. The breakdown
  must add up to the daily total; exclude idle gaps and count overlapping work
  only once. Use available local records or human-provided times, label estimates,
  and report gaps instead of inventing time. Preserve existing entries and avoid
  counting previously logged work again. This rule authorizes routine daily
  updates to AI_Docs/TIME_LOG.md only; README.md and sprint_time_log.md remain
  protected from edits.
- Put agent workflow rules and approval requirements in AGENTS.md. Changes to
  AGENTS.md still require explicit human approval.

## Tech stack

- React 19 with function components and hooks, written in JavaScript (`.jsx`).
- Vite for the frontend development server and production build.
- Plain CSS with design-token variables for colors, fonts, spacing, radii, and
  shadows.
- Neon PostgreSQL for persistent food, nutrition, user-log, and barcode data.
- A small backend/API layer for database access; the browser must never connect
  directly to Neon with a secret connection string.
- Netlify for hosting the built frontend and configuring deploy previews.
- Vitest and React Testing Library for tests, using `userEvent` for interactions.
- ESLint and Prettier for code quality and consistent formatting.

## Project structure

```
NourishNet/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
├── Backend/
│   ├── src/
│   │   ├── db/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── AGENTS.md
└── AI_Docs/
    ├── PLAN.md
    ├── STYLE_GUIDE.md
    ├── SECURE.md
    ├── LEGAL.md
    └── HUMAN.md
```

The exact folder names may grow with the implementation, but components, hooks,
pages, and database services should remain easy to find.

- Give each custom component its own PascalCase folder under
  `Frontend/src/components/`, for example `FoodCard/FoodCard.jsx` with
  `FoodCard.test.jsx` and any component-specific CSS beside it. Closely related
  named exports, such as loading/empty/error states, may share a component folder.
- Keep `components/shared/index.js` as the public export entry point for shared
  controls and `components/shared/shared.css` for their common styles. Component
  dependencies use explicit relative paths to the owning component folder.
- When moving a component, update imports, exports, styles, and tests together;
  verify both direct imports and the shared export entry point still work.

## Neon and secrets

- Keep the Neon connection string and all administrative credentials on the
  backend only, in an ignored `.env` file or the deployment provider's secret
  configuration.
- Never put database credentials, admin passwords, or private API keys in
  `Frontend/`, a `VITE_` variable, source control, screenshots, or command output.
- The frontend calls backend endpoints. Backend code validates input and uses
  parameterized SQL queries.
- Require separate development, preview, and production Neon databases or
  branches. Use synthetic data; branching production data does not make it safe
  for development. Never experiment against the live database.
- Database schema changes require human developer approval before they are
  applied. Record approved migrations in the backend migration folder.

### Neon setup and operating status (2026-11-11)

The human developer requested this section and approved free-services-only Neon
setup. This is not approval to incur charges or publish the app to real users.

- Target organization: `org-floral-bread-69229530`; project:
  `mute-hall-50914206`; initially linked branch: `production`.
- The developer confirmed this was a newly created project with no changes or
  expected real data and authorized synthetic setup/testing there. The branch
  name does not mean NourishNet is approved for public production use. Recheck
  the target before migrations or writes; the initial confirmation does not
  authorize experimentation after real data is introduced. Keep development,
  preview, and eventual production data separate.
- Neon CLI 9.3.2 was installed. Root `neon.ts` declares Auth and beta Realtime
  (`preview.realtime`); Postgres belongs to the linked branch. Root dependencies
  include `@neon/config` and `@neon/env`; retain their lockfile.
- Local project link/config exist. The human's console screenshots and report
  confirm Auth provisioned, trusted domain `https://thenourishnet.netlify.app`,
  email signup/sign-in, required verification codes, and Realtime enabled.
  CLI authentication and remote application schema have not been verified.
  Local hosted API/Auth code is prepared; no hosted end-to-end pass is recorded.
  Inspect current state before resuming; configuration is not integration proof.
- Frontend build commands run in `Frontend/`; backend commands run in `Backend/`.
  Root `npm run build` delegates to the frontend; `npm run build:hosted` requires
  the public Auth URL and forces Neon mode. Local backend services keep their
  loopback restriction; Netlify's separate hosted service requires an exact Neon
  hostname/database match, synthetic-development flags and approved tester list.

### Neon CLI and application integration

- Use `neon` (`neon.cmd` in PowerShell where needed). If installation fails, use
  `npx neon@latest` instead. Check `--help` for the installed version before
  assuming a flag exists. Preserve existing files when repeating initialization.
- For browser authentication, tell the human to finish sign-in there. If login
  fails or expires, ask the human to run `neon login`, then retry. Never request
  credentials in chat or print local CLI credential files.
- `neon init` links the working directory and creates configuration. Use
  `--no-agent-setup` when preserving existing coding-agent configuration; automatic
  setup must not overwrite AGENTS.md or protected guidance. Consult installed
  Neon skills when available; read the relevant instructions before using them.
- Before an authorized deployment, inspect `neon config plan`, confirm the
  organization/project/branch, and verify the actual account plan and usage.
  `neon deploy` applies `neon.ts` and normally pulls service environment variables.
  Do not use automatic override/protected-branch bypass flags to silence conflicts.
  A service deployment does not automatically migrate application tables, wire
  React/backend code, or host the existing Node server and frontend.
- Keep `.neon` local context and all real `.env`/`.env.local` files ignored.
  Review CLI output for secrets before reporting it. Root environment files are
  not automatically loaded by the backend's existing `Backend/.env` start command;
  explicitly configure server-side loading and test it without exposing values.
- Keep `DATABASE_URL` and service/admin secrets backend-only. The existing Node
  backend uses `pg.Pool`; retain it unless a reviewed runtime/driver change is
  needed. Use parameterized queries, bounded connection pools, verified TLS for
  remote Postgres, and migration files. Do not connect React directly with a
  database password or copy pulled secrets into `VITE_` variables.
- Auth must resolve a verified identity to private application ownership.
  Realtime subscriptions must enforce that same access boundary; never expose
  all diary rows through a shared/public feed. Enabling either service alone
  does not establish account isolation. Use service-specific official guidance
  and test two synthetic accounts before reporting integration complete.
- Automated unit/component tests keep using mocks. Run separately identified,
  human-authorized end-to-end checks against the confirmed synthetic target for
  each wired service. Report build output, test results, and failures without
  revealing connection strings, tokens, recovery codes, or diary contents.

### Free-plan limits and change approval

The developer intends to use the Free plan and has not authorized payment.
No-payment-information is not proof of the organization's effective plan.
Verify the current plan in Neon before provisioning or changing capacity. The
following published allowances were checked on 2026-11-11; they are ceilings,
not a resource allocation or a guarantee of remaining quota:

| Resource                    | Published Free-plan allowance                                         |
| --------------------------- | --------------------------------------------------------------------- |
| Projects and branches       | 100 projects; 10 branches per project; extra branches unavailable     |
| Postgres compute            | 100 CU-hours per project per month; size up to 2 CU (8 GB RAM)        |
| Idle compute                | Scales to zero after 5 minutes; allow for wake-up latency             |
| Postgres storage            | 1 GB per project; 20 GB across the account                            |
| Public network transfer     | 5 GB per project per month                                            |
| Managed Auth                | Up to 60,000 monthly active users per project                         |
| Realtime                    | Free during beta; underlying database and transfer limits still apply |
| Restore/history             | Up to 6 hours, limited to 1 GB of changes; 1 manual snapshot          |
| Monitoring and availability | 1-day monitoring retention; no uptime SLA                             |

- Recheck [Neon pricing](https://neon.com/pricing) and
  [Neon plans](https://neon.com/docs/introduction/plans) before relying on these
  limits. Record discrepancies; do not silently substitute old remembered quotas.
  Beta availability and pricing can change.
- Keep scale-to-zero enabled. Avoid keep-alive queries, unbounded polling,
  repeated full-table reads, bulk fixtures, load tests, unnecessary branches, and
  long-running subscriptions that consume quota without serving the task. Check
  current usage and estimate the proposed work before large imports or tests.
- If a limit is reached or the plan/remaining allowance cannot be verified, stop
  the affected remote operation and report the limit and a free alternative.
  Do not upgrade, enable overages, add billing details, purchase credits, or retry
  indefinitely. Do not delete data or branches to reclaim space without approval.
- An AI may request permission for a project/service change that is expected to
  remain free. Explain the exact change, target, reason, relevant quota/current
  usage, and verification/recovery approach. Obtain approval before a new schema,
  API rule, package, branch/service/capacity change, or migration not already
  covered by the human's specific request. Do not repeatedly ask for the same
  approved action; read-only inspection and routine in-scope local work may proceed.
- Existing approval covers the requested Postgres/Auth/Realtime setup and
  synthetic verification within the Free plan. It does not authorize unrelated
  services, AI Gateway credits, paid email providers, paid storage, or a hosting
  plan upgrade. If any proposed action might incur charges, use the existing
  **THIS MAY COST MONEY** approval rule and wait for explicit spending approval.
- Neon service setup does not establish the Netlify account's tier, deploy quota,
  backend hosting, or pricing. Verify those separately before a hosting change;
  never assume every connected provider is free because Neon is Free.

CLI references: [init](https://neon.com/docs/cli/init),
[deploy](https://neon.com/docs/cli/deploy). Future changes to this file still
require explicit human approval.

### Neon database release cadence and budget

The human requested that Neon follow the same human-approved release discipline
as Netlify. Prepare migrations locally, group substantial schema/catalog/service
changes into reviewed sprint releases, and obtain approval for the exact target,
SQL/migration filenames and checksums before applying them. The planned release
dates are November 14, November 28, and December 12, 2026; dates are not approval.
Out-of-cycle fixes require their own review. Routine approved users' diary writes
are application activity, not migrations, and must not be delayed to sprint end.

- Never run `neon deploy`, migration/seed/restore commands, or branch/service
  changes from app startup, a normal build, an ordinary Git push, or a scheduled
  job. `neon deploy` applies service policy; it does not apply our SQL migrations.
  Keep these as separately approved operations in the release checklist.
- Before a remote release, verify actual plan/cycle usage for all relevant
  branches, proposed locks/data volume, required dependencies, and a recovery
  approach. Account for backup/snapshot space and whether the short Free restore
  window is adequate. Prefer additive/backward-compatible changes, then deploy
  compatible code, then validate; never reset or reseed an existing database.
- Internal planning caps retain 20% headroom: projected compute at most 80 of
  100 CU-hours/project/cycle, storage at most 0.8 of 1 GB/project, and network
  transfer at most 4 of 5 GB/project/cycle. These are conservative planning
  limits, not provider-enforced caps. Check account-wide storage, branch and Auth
  quotas separately. Unknown usage is a blocker for the affected remote release.
- `npm run release:plan -- <budget-file>` calculates estimates for both providers
  without connecting to them. Use current dashboard numbers, not invented zeros;
  the example intentionally has unknown values. Passing the plan is neither
  human approval nor a guarantee about future traffic. Preserve private release
  records under `private-artifacts/` and never fabricate approval records.
- If any projected use exceeds these caps or Free availability is uncertain,
  reduce/split the change or wait for reset. Ask before touching the reserve,
  purchasing resources, or changing plans. Existing **THIS MAY COST MONEY** and
  explicit spending-approval rules continue to apply.
- Migration 007 adds adult-confirmed hosted profiles and is prepared for review;
  it has not been applied remotely. Initial hosted dependencies are 001, 002 and
  007, after checking actual migration history; do not blindly apply 003–006.
  No migration of local passwords/users into Neon Auth is implied.

## Netlify pipeline and free-service budget (2026-11-11)

The human requested Netlify Free hosting with a planned release at each sprint
end. Preparing configuration is approved; no Netlify upload, draft/preview,
production publish, retry, rebuild, or rollback is approved merely by that plan.
Every push/deploy to Netlify requires specific human approval and a budget check.
GitHub pushes must not silently trigger Netlify deploys.

### Pipeline and current limitations

- Human-approved Free-plan adjustment (2026-11-12): Netlify Free environment
  variables use all scopes. Functions-only scoping and paid secret-controller
  features are not required for this internal setup. Store the pooled database
  URL in Netlify's environment configuration for the production context; it may
  be available to the controlled build process and server runtime, but must never
  enter browser code, a `VITE_` variable, static assets, logs, or Git. Keep builds
  and previews from untrusted source disabled. Do not upgrade to obtain scoping.
  Application database access remains server-only. This specific exception
  replaces earlier Functions-only environment setup instructions.

- Repository: `hepercretical/NourishNet`. Root `netlify.toml` uses repository root
  as base, installs frontend/backend packages, runs `npm run build:hosted` with
  Node 24, and publishes only `Frontend/dist` plus `netlify/functions`. It sets
  `build.ignore = "exit 0"` to skip Git-triggered builds. Keep automatic production,
  branch, and PR preview deploys disabled in the hosted site's settings as well;
  the file alone is not proof of the remote settings or a universal deploy gate.
- `.github/workflows/release-checks.yml` is a manual `workflow_dispatch` check:
  frontend/backend install, format check, lint, tests, frontend build, and a
  one-day artifact identified by commit SHA. It has no deployment credentials or
  upload-to-Netlify step. It runs only after committed/pushed to GitHub and
  manually started. A green check or artifact is not human deploy approval.
- The human reports `thenourishnet.netlify.app` is linked to GitHub, builds are
  stopped, latest deploy succeeded, and Free plan has 285 credits remaining.
  This is a dated report, not a live budget query. The site ID, CLI connection and
  hosted API remain unverified. Link that existing site rather than creating duplicates. Creating/importing
  a site can trigger an initial deploy: obtain approval and budget for it first.
- For initial setup, prefer a manual-upload site without Git auto-deploy. Link it
  locally only after its identity is confirmed. Never publish the repository root,
  `.env`, `Backend/`, `node_modules/`, or private artifacts as static assets.
  Server-only backend modules may be packaged into the approved API Function.
  Keep `.netlify/`
  ignored; deployment tokens belong in approved secret storage, never chat/Git.
- The Vite dev-server `/api` proxy is local only. A modern Netlify Function now
  provides the hosted `/api/*` route with bearer-token verification and the same
  diary repositories. Deployment/environment/database setup and end-to-end
  verification remain required before claiming the deployed diary works.
  Neon remains the database provider; do not provision Netlify Database by default.
- Sprint releases use synthetic data and approved review scope. The existing
  post-Sprint-3 public-release gate remains in force; a deploy URL must not be
  treated as permission to onboard real users. Confirm the available access
  controls before uploading internal work; do not assume free previews are private.

### Published limits and internal allocation

Sources checked 2026-11-11: [Netlify pricing](https://www.netlify.com/pricing/) and
[credit-plan documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).
Verify the actual team's plan, billing-cycle dates, current usage and current
rates before every deployment. Legacy Free accounts can have different limits.

| Current credit-based Free meter | Published allowance/rate                                      |
| ------------------------------- | ------------------------------------------------------------- |
| Monthly allowance               | 300 credits, shared by the team; hard limit, no auto recharge |
| Production deploy               | 15 credits each                                               |
| Bandwidth                       | 20 credits/GB                                                 |
| Web requests                    | 2 credits/10,000 requests                                     |
| Server compute                  | 10 credits/GB-hour                                            |
| Concurrent builds               | 1                                                             |

Free credits reset by billing cycle and do not roll over. At the limit, service
can pause; free does not mean unlimited availability. No upgrades, credit packs,
paid domains, paid add-ons, or payment details are authorized.

Use this conservative project planning allocation within the team's remaining
allowance; these are internal caps, not provider-enforced limits:

- Up to 60 credits per cycle for production deploys (at most four at the current
  rate, including any chargeable retries/rebuilds/republishing). Normal cadence is
  one per sprint; unused deployment allocation is not permission for extra deploys.
- Up to 180 credits for ongoing traffic/requests/compute and other approved usage.
- Keep at least 60 credits unallocated as a safety reserve. Subtract other sites'
  usage and commitments first; NourishNet does not own the entire team's allowance.
- Before approval, record current team usage U, estimated deployment cost D,
  reserved cost of remaining planned deploys P, and forecast remaining runtime
  use R. Require `U + D + P + R + 60 <= 300`, and also meet the category caps.
  If plan, usage, forecast, or remaining budget is unknown, stop the remote action
  and ask the human to check the dashboard. Record projected versus actual usage
  after deployment in an ignored private release record.
- Reaching an internal cap/reserve is a stop-and-review condition. Do not retry
  failed deploys automatically or spend the reserve without a new approved budget.
  Traffic varies, so this process reduces risk but cannot guarantee no interruption.
- Neon quotas are separate and remain as documented above. Also verify GitHub
  Actions minutes/artifact storage before running hosted checks, especially for a
  private repository. Manual checks have a 15-minute job timeout and one-day
  artifact retention; do not assume GitHub compute is unlimited or free.

### Sprint release approval

Planned review dates are November 14, November 28, and December 12, 2026. These
are human-reviewed release opportunities, not scheduled automatic deployments.
November's two planned production publishes would consume 30 credits; December's
one would consume 15, before traffic, compute, other projects, and any retries.
Use actual billing cycles when reserving credits rather than calendar months.

Before each Netlify upload, present the exact commit/artifact, target site,
draft or production context, sprint, passing checks, API readiness, access scope,
current cycle usage, estimated credit cost, remaining planned releases and safety
reserve. Request human approval for that one action. If there is any possibility
of monetary charges, include **THIS MAY COST MONEY** and obtain explicit spending
approval under Boundaries. Being within Free limits never waives deploy approval.

After approval, deploy the reviewed build once, verify the returned URL and relevant
flows without exposing secrets, record actual usage/outcome, and report failures.
Further deploys or retries require their own approval. Do not treat approval to
push source to GitHub as approval to deploy to Netlify.

## Code style

- Break the website into focused components. For example, the header belongs in
  `Header.jsx`, not in a page component's large render block.
- Keep HTML entry files, page components, and CSS entry points small. Put reusable
  behavior in components, hooks, and utilities.
- Hooks start with `use` and live in `Frontend/src/hooks/`. Components never call
  the database directly; they use a hook or an API service.
- Every screen that loads data shows loading, error, and empty states.
- Colors, fonts, spacing, and other visual values come from design-token
  variables, not unexplained hard-coded values.
- Whenever creating or editing a CSS file, read `AI_Docs/STYLE_GUIDE.md` first and follow
  its rules throughout the change.
- Use real controls such as `<button>`, `<input>`, and `<label>`; do not make a
  clickable `<div>`.
- Prettier decides formatting: 2-space indentation, single quotes, and a 100-column
  line width. Run `npm run format` before committing.

```jsx
// Good: data access is isolated in a hook and the screen can show each state.
const { foods, loading, error } = useFoods(searchTerm);

// Bad: a component opens a database connection on every render and has no error
// or empty state.
```

## Testing

- Every custom component must have automated tests in a colocated
  `<ComponentName>.test.jsx` file. Test every exported component in files with
  multiple related components. Add or update these tests whenever creating,
  changing, or moving a component; integration tests supplement these tests.
- Verify meaningful visible output and interactions, including relevant props,
  keyboard access, disabled/pending behavior, and applicable data/error states.
  A render-only smoke test does not establish that a component works properly.
- Test components the way a user sees them: find controls with `getByRole` and
  `getByText`, and interact with them using `userEvent`.
- Mock the backend/API client. Tests must never call the real Neon database.
- Name tests by what the user sees, for example:
  `it('adds breakfast calories to the daily total')`.
- For a bug, first write a test that fails, then fix the code. Do not delete,
  skip, or weaken a failing test to make it pass.
- Include tests for loading, error, empty, validation, and successful states when
  a feature has those states.

## Workflow

1. Before implementing a plan, read its acceptance criteria in `AI_Docs/PLAN.md`. Ask the
   human developer if an acceptance criterion or dependency is unclear.
2. Build with `npm run dev` and the development API/database configuration, then
   repeat `npm run lint`, `npm test`, `npm run build`, and `npm run format` until
   the relevant acceptance criteria pass.
3. Explain what changed in simple words, with a small example and what to click
   to try it.
4. At the end, go through the story's acceptance criteria one by one and say
   which pass and how you checked them.

Documentation-only work requires document/link/consistency and ignore-rule checks;
report unavailable application checks honestly. For scaffolded packages, run
frontend lint, tests, build, and format, and backend lint, tests, and format.
Start the development services for runtime changes. Do not add unrelated packages
just to check documentation.

## Git

- Commit only when asked. Suggest the commit message and wait for an OK.
- Use a short summary line followed by a few bullets, for example:
  `Plan-14: Add barcode lookup`
  `- Add the barcode search hook and API route.`
  `- Show the not-found submission form.`
- Open a pull request to `main` only after `npm run lint`, `npm test`,
  `npm run build`, and `npm run format` pass. A teammate reviews it before it is
  merged.
- Keep `.env`, `node_modules/`, `dist/`, and local database copies out of commits.
  Stage files by name instead of using `git add .`.

### Ongoing ignore-rule maintenance

The human developer explicitly requested this guidance on 2026-11-09. It applies
throughout development, including Sprints 1-3; it does not defer existing secret
protection until the later security phase.

- Review and update the root `.gitignore` whenever a tool, dependency, environment,
  database, upload flow, test, or export creates a new kind of local/private file.
  Add the exclusion before generating sensitive output. Check root, `Frontend/`,
  and `Backend/`, including nested files and credential/backup filename variants.
- Follow the checks in
  [SECURE.md's ongoing ignore-rule maintenance](AI_Docs/SECURE.md#ongoing-ignore-rule-maintenance)
  before staging, before each commit, and after changing ignore rules. Verify
  representative private paths are ignored and required source, lockfiles,
  reviewed migrations, synthetic seeds, and safe examples remain visible to Git.
- Keep plan-specific review contracts in ignored `contracts/` directories. Keep
  private artifacts in the existing ignored private-output directories. Do not
  hide required application source or actual migration history with broad rules.
- Inspect tracked/untracked filenames and staged content for credentials and
  personal data without printing secrets. `.gitignore` neither protects an
  already tracked file nor detects secrets inside an allowed source file. Stop
  staging/committing if a sensitive file is tracked or staged; report it safely
  and obtain approval for any required untracking/history changes. Exposed
  credentials require revocation/rotation, not just a new ignore rule.
- Include ignore-rule verification and any unresolved findings in the completion
  report. Do not claim these patterns guarantee that every possible secret is
  excluded. This maintenance rule does not authorize commits, pushes, paid
  services, or edits to protected guidance beyond the human's explicit request.

## Boundaries

- **Costs:** No action that could cost money is approved by default. Before any
  potentially paid action, including hosting or pushing/deploying to Netlify or
  Neon, ask the human developer for explicit approval and display the exact text
  **THIS MAY COST MONEY** in the permission request. General feature, setup, or
  deployment instructions do not authorize spending money.
- **Always:** stay inside the requested plan and run lint and tests before
  committing.
- **Ask first:** changing a database table or API rule, changing design tokens,
  adding an npm package, deleting records, touching
  the live database, force-pushing, or changing this file.
- **Component ownership:** The human developer is the sole developer working with AI.
  Existing components may be edited within the explicitly requested plan or task;
  separate teammate-component approval is not required.
- **Secrets:** never put an admin password or API key in `Frontend/src/`, in a
  `VITE_` variable, in a commit, or in output and logs. Do not print `.env`.
- **Failing tests:** fix the code, never the test.
- **When stuck:** if something still fails after a couple of focused attempts,
  stop and ask the human developer.
