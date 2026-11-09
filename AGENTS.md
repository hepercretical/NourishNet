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
npm install
npm run dev
npm run lint
npm test
npm run build
npm run format
```

Run these from `Backend/` after the server package has been scaffolded:

```bash
npm install
npm run dev
npm run lint
npm test
npm run format
```

If a command is not available yet, add the matching package script as part of the
scaffolding plan instead of silently substituting an unrelated command.

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

The project currently has no scaffolded package scripts. Documentation-only work
requires document/link/consistency and ignore-rule checks; report unavailable
application checks honestly. Once scaffolded, run frontend lint, tests, build, and
format, and backend lint, tests, and format. Start the development services for
runtime changes. Do not add unrelated packages just to check documentation.

## Git

- Commit only when asked. Suggest the commit message and wait for an OK.
- Use a short summary line followed by a few bullets, for example:
  `Plan-06: Add barcode lookup`
  `- Add the barcode search hook and API route.`
  `- Show the not-found submission form.`
- Open a pull request to `main` only after `npm run lint`, `npm test`,
  `npm run build`, and `npm run format` pass. A teammate reviews it before it is
  merged.
- Keep `.env`, `node_modules/`, `dist/`, and local database copies out of commits.
  Stage files by name instead of using `git add .`.

## Boundaries

- **Always:** stay inside the requested plan and run lint and tests before
  committing.
- **Ask first:** changing a database table or API rule, changing design tokens or
  another teammate's component, adding an npm package, deleting records, touching
  the live database, force-pushing, or changing this file.
- **Secrets:** never put an admin password or API key in `Frontend/src/`, in a
  `VITE_` variable, in a commit, or in output and logs. Do not print `.env`.
- **Failing tests:** fix the code, never the test.
- **When stuck:** if something still fails after a couple of focused attempts,
  stop and ask the human developer.
