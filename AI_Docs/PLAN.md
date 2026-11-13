# NourishNet plan

## Approved delivery schedule

The human developer requested this three-sprint feature schedule on 2026-11-09
and clarified that Sprint 1 began November 1 and Sprint 3 ends December 12.
This replaces the previous seven-sprint schedule. Dates below are targets, not
completion claims. The November 12 update below reprioritizes Sprints 2 and 3
against the current implementation and the human's clarified food-data/photo scope.
No acceptance criterion is completed by this document update.

| Phase           | Dates (2026)  | Required outcome                                                                     |
| --------------- | ------------- | ------------------------------------------------------------------------------------ |
| Sprint 1        | Nov 1-14      | Complete initial screen/flow design, foundations, accounts, and core tracking        |
| Sprint 2        | Nov 15-28     | Finish actual food data, database logging, known-product scanning and filler removal |
| Sprint 3 Week 1 | Nov 29-Dec 5  | Finish photo-to-catalog review, goals, connections and calendars; freeze features    |
| Sprint 3 Week 2 | Dec 6-12      | Final bug fixes, regression tests, accessibility/visual/performance quality checks   |
| After Sprint 3  | Dec 13 onward | Implement SECURE.md and LEGAL.md, then approve public release                        |

All initial design and functionality must be finished by December 5. December
6-12 is reserved exclusively for final bug fixes and quality checks; it is not
extra feature-development time. Review team capacity and unresolved dependencies
early. If a target slips, ask the human developer to revise scope or timing rather
than silently using the quality week or moving features into the later phase.

## Scope and phase rules

- Initial functionality includes adult accounts; food search and meal logging;
  calories, macros, sodium, servings, totals, and editing; barcode/manual lookup;
  package/label photo submission and reviewer-approved catalog reuse; estimated
  gain/lose/maintain and muscle-gain goals; historical goals; accepted private
  connections with selected progress sharing; and personal/friend calendars. The November 12 design update also includes
  daily macro goals/summary, private weight history and Preferences/themes.
- Implement and verify requirements from SECURE.md and LEGAL.md only AFTER
  Sprint 3. They do not gate initial design, functionality, or the quality week.
  Their detailed requirements remain preserved in those documents. This timing
  also applies to security/legal requirements repeated in HUMAN.md and
  STYLE_GUIDE.md. Plan-26, Plan-27, Plan-28, and Plan-29 implement the later phase.
- Sprints 1-3 deliver an internal development version using synthetic accounts,
  measurements and diaries; food catalog records must be actual source-backed foods.
  Use non-personal package/label photos, not invented products or nutrition values.
  A feature-complete internal version
  is not public-release approval. Real-user onboarding and public deployment
  follow the later phase; do not claim unfinished controls are implemented.
- Existing AGENTS.md requirements remain applicable: protect secrets, keep Neon
  access server-only, use parameterized SQL and synthetic development data,
  honor approval boundaries, and show the mathematical-estimate/medical notice.
  Keep existing safeguards and .gitignore; do not remove controls to defer work.
- Account ownership, accepted connections, sharing/revocation, blocking/reporting,
  and catalog-review status are functional product behavior in the initial build.
  Comprehensive attack testing, production security controls, policies/consent,
  retention, rights/export/deletion, operational evidence, and compliance review
  are required only in the post-Sprint-3 phase.
- Netlify hosts the frontend; Neon PostgreSQL stores persistent records through a
  backend API. Human approval is still needed for auth/backend/storage choices,
  packages, API rules, applied migrations, token changes, and teammate components.
- OCR, public profiles/open follows, messaging, leaderboards, payments and advertising
  remain separately approved future work. Light/Dark and accent themes are now
  approved product scope; exact token palettes still require review.
- Root AGENTS.md and every applicable AI_Docs/*.md file remain the guidance set.
  This is the only PLAN.md; no root duplicate is maintained.

## Current design and implementation update (2026-11-12)

[DESIGN.md](DESIGN.md) captures the human's latest screenshots, behavior decisions
and clarified logged-day/shade rules; [STYLE_GUIDE.md](STYLE_GUIDE.md) governs their
presentation. Both documentation and local app implementation were requested.
Connections' temporary Coming Soon... page is the sole no-placeholder exception.
Signup-only age confirmation replaces general age-gating banners. Deficit/surplus/
maintain comparisons, six calendar shades and any-one-food logged-day behavior
are specified in DESIGN.md. The human subsequently approved internal technical
review for this local implementation; later independent review remains deferred.

Add the new design work below in dependency order; do not rebuild passed barcode/
submission functionality. All added criteria remain unchecked until verified.
Existing checked evidence describes the earlier build, not acceptance of the new
screens. Preserve the December 5 feature freeze and December 6-12 quality-only
week. Added scope/effort needs capacity review; dates are targets, not proof that
this larger scope fits. Escalate a schedule conflict rather than silently move work.
No remote provider operation, API rule, migration application, package or exact
palette/formula approval is implied. Prepare concrete proposals locally first.

## Local acceptance authorization (2026-11-12)

The human explicitly requested that acceptance criteria be checked as work passes.
During the current local-only task, criteria that mention Neon or Netlify may pass
using the equivalent working local implementation and verification. Hosted
pushes, migrations, provider testing and deployment stay deferred until a later
human-approved sprint release. A checked box in this phase is local evidence,
not a claim of hosted verification or release approval. Record the local checks
and limitations; do not claim physical-camera or human-review testing not done.

## Latest Sprint 1/2 revalidation (2026-11-13)

The current local revision passes frontend lint, 287 tests, build and format check;
backend lint, 255 tests and format check; actual-catalog/diary 56, barcode 20,
submission 25 and personal-tracking 53 explicit local check groups. Existing diary
snapshots were preserved. November 13 also adds 22 Fairlife-specific local lookup,
confirmed-save/retry/totals/ownership checks. The requested single-bottle food was
added as an actual source-backed record, UPC 811620022118; existing catalog and
diary snapshots remain unchanged. No Neon/Netlify test, migration or deployment was run.
The per-criterion evidence is in ignored private-artifacts/sprint-1-2-revalidation.json.

Plan-03's human layout/token-review criterion is reopened for the revised five-tab,
goal/Stats/theme UI. Prior approval is historical evidence, not a fresh device
review. Plan-15's physical-phone criterion and the three explicitly human/device
Plan-18A criteria remain open. Automated scanner detections do not prove physical
camera decoding. All remaining checks are assessed using the current DESIGN.md
exceptions: actual catalog foods replace active synthetic foods, signup-only age
confirmation replaces repeated banners, and Connections is the sole approved
Coming Soon page. Thus not every Sprint 1/2 acceptance criterion is currently met.

The initial synthetic-only verification scripts/seed are historical fixtures;
they were not run against the current catalog or used to invent new food records.
Their current actual-food equivalents and mocked failure/unknown-data checks
provide this revalidation evidence. Keep historical design/schema evidence.

## Shared initial acceptance criteria

Mark each acceptance criterion as `[x]` when its requirements have been completed
and verified. Leave incomplete or unverified criteria as `[ ]`.

Human approval granted 2026-11-09: AI agents may change an acceptance-criterion
checkbox from `[ ]` to `[x]` once that criterion is completed and verified, without
asking for separate approval for that checkbox update. Report the verification
evidence and any limitations. This approval covers checkbox completion only; it
does not authorize changing criterion text, scope, dependencies, schedules, other
documentation, or actions that require their own approval under AGENTS.md.

Every applicable initial story includes loading, error, empty, validation, and
success states; accessible controls; responsive UI; useful copy; and user-focused
Vitest/React Testing Library coverage using mocked APIs and userEvent. Tests never
contact real Neon. Runtime development uses the development API/database with
isolated personal test data and actual food records. Run frontend dev/lint/test/
build/format and backend dev/lint/test/
format once scaffolded; record results honestly. Documentation-only changes use
document, reference, dependency, and formatting checks instead.

Finish the layout and interaction design for all initial screens in Sprint 1,
including space for later legal/settings controls. Final policies and operational
rights controls are not initial functional deliverables; omit unfinished actions
from the application by November 28. Keep planned locations in documentation,
without placeholder pages or buttons in the application, except the explicitly
approved temporary Connections page described in DESIGN.md. Initial quality review
covers implemented flows. Repeat the
relevant reviews after security/legal features are implemented.

Points remain relative estimates, not staffing or deadline guarantees. Keep
existing story IDs stable when delivery order changes. Plan-14A and Plan-18A
cover explicit integration/cleanup work, not a rebuild of completed Sprint 1 code.

## Current-state review and reprioritization (2026-11-12)

The human developer requires working food data, food logging and barcode scanning
for private testing by November 28, with all filler removed by that date. The
clarification requires actual food records without generated synthetic food data;
known barcode -> database food ID -> deliberate diary save must work in Sprint 2.
Unknown products prompt package-front and nutrition-label photo submission;
reviewing/adding the food from those photos is due halfway through Sprint 3,
December 5. This replaces the November 9 sequencing table.

Evidence reviewed: frontend/backend source, migrations, synthetic seed, and
README.md's November 12 setup/release record. No remote service was inspected or
application check run for this documentation change.

- Plans 01-13 are recorded complete. Existing local/API code covers accounts,
  search, four meals, serving confirmation, persistence, date navigation, totals,
  editing and removal. Verify/integrate this work rather than rebuild it.
- README.md records hosted migrations 001/002/007 and the initial seed applied,
  backend food reads, and a protected Netlify publish. Use this newer record for
  planning instead of older setup notes, without treating it as a fresh check.
  Hosted authenticated diary journeys remain unverified; approved tester-email
  configuration was deferred. The non-login seed identities are not test logins.
- The seed has only two fictional food/serving records and no actual product
  barcode mappings. They do not satisfy the clarified catalog requirement.
- Barcode lookup/camera, persisted photo submissions/review, goals, connections
  and calendars remain unfinished. App navigation reaches design previews and
  disabled examples; the diary contains out-of-scope tracking filler.
- Plan-13's local specification records internal technical review and deferred
  independent professional review. Preserve that status; do not claim clinical
  validation or invent replacement formulas when implementing Plan-19.

### Priorities and completion targets

1. Finish the database/API/catalog and authenticated diary testing path first
   (Plan-14A), with actual product/label records and usable barcode mappings.
2. Complete known-barcode lookup, real phone camera decoding and manual fallback
   into serving/meal confirmation and a single persisted save (Plan-14/15).
3. Give unknown products a working two-photo submission intake and stored pending
   status in Sprint 2 (Plan-16/17). This is a real submission, not a placeholder
   button or a claim that the product has already entered the catalog.
4. Pass the core-functionality and no-filler gate by November 28 (Plan-18A).
5. Complete photo-to-catalog review/reuse plus goals, connections and calendars
   in Sprint 3 Week 1; integrate continuously and freeze by December 5.
6. Use December 6-12 exclusively for fixes and quality checks. Implement/verify
   SECURE.md and LEGAL.md after Sprint 3, starting December 13.

| Completion target (2026) | Module              | Required handoff                                                                               |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------- |
| Nov 15                   | Plan-14A decisions  | Confirm private target, tester access, actual catalog source/coverage and scanner approach     |
| Nov 17                   | Plan-14A            | Actual food records and database-backed search/log/edit/remove/refresh verified                |
| Nov 18                   | Plan-14             | Known barcode resolves to catalog food/serving ID; unknown result never invents a match        |
| Nov 20                   | Plan-15             | Physical-phone scan and manual entry confirm and save known foods once                         |
| Nov 23                   | Plan-16             | Unknown barcode opens working package-front/label photo form                                   |
| Nov 25                   | Plan-17             | Photo intake, pending status, correction and retry persist                                     |
| Nov 27-28                | Plan-18A            | Database/logging/scanner human testing and complete application filler removal                 |
| Nov 30                   | Plan-19             | Goal estimate review, acceptance and persistence                                               |
| Dec 2                    | Plan-18             | Read actual package/label photos, review values, publish catalog food/barcode and verify reuse |
| Dec 3                    | Plan-20 and Plan-21 | Connections/sharing plus historical goals and personal calendar                                |
| Dec 4                    | Plan-22             | Shared-progress comparison against each person's historical goal                               |
| Dec 5                    | Plan-23             | Combined journeys, human review, photo-to-catalog deadline and feature freeze                  |
| Dec 6-12                 | Plan-24/25          | Existing-feature defects, regression and quality only                                          |
| Dec 13 onward            | Plan-26/27/28/29    | Security/legal implementation, verification and later public-release gate                      |

Targets include usable mobile states and tests. This is a single-human-developer
schedule, not assumed parallel staffing. Prepare contracts and approval questions
early; integrate modules as they land. Plan-16 can use manual unknown-barcode input
before camera work finishes. Goal acceptance precedes history; sharing/history
precede comparisons. Begin each downstream integration as soon as inputs exist.

Dates and this planning request do not authorize packages, API rules, applied
migrations/imports, provider changes, spending or deployments. Resolve source/
scanner decisions before Plan-14/15, storage/submission decisions before Plan-17,
reviewer rules before Plan-18 and discovery/report routing before Plan-20. Retain
AGENTS.md's exact-target, checksum, budget and one-action release approvals. Do not
wait until a sprint-end publish to discover a blocked testing prerequisite.

Review remaining effort/approvals November 21 and November 28. Sprint 3 Week 1 is
tight, especially photo review plus goals -> history and connections -> comparison.
If capacity/dependencies threaten December 5, present remaining effort and seek a
human scope/timing decision. Do not silently drop features, move new work into
December 6-12, or call a preview complete. Realtime subscriptions, OCR, decorative
features and unrelated catalog/search expansion are not prerequisites.

### Actual food data and no-filler deadline

The testing app must use actual foods, serving sizes, label nutrition and product
barcode mappings with recorded sources. Do not generate synthetic food records,
made-up nutrients, fake package photos or invented barcode-to-product links. The
human confirms a bounded representative catalog and source/access method early;
no arbitrary food-count quota or external provider is selected by this plan.
Choose the source before relying on it; no external API/package/import is approved
here. Broader legal-readiness review remains in the post-Sprint-3 phase.

Remove existing fictional catalog records from the normal application through a
human-approved data cleanup/migration, preserving dependent diary snapshots and
history. Never reset/reseed the database or delete records without approval. Test
accounts/measurements/diaries remain isolated under AGENTS.md; this catalog change
does not authorize real-user onboarding. Existing automated mocks are test tools,
not application food data; do not create new synthetic catalog/demo filler.

By November 28, audit every visible or directly opened application route, menu,
tab, button, link, image, field, title and text block. Remove design previews,
disabled example controls, coming-soon buttons, lorem ipsum, fake profile/contact/
activity text, injected sample diary entries, invented goal allowances and the
Exercise/Weigh-in/Water filler sections. A fresh account starts with an empty
diary and useful real instructions. Keep genuine loading, empty, no-results,
validation, permission, error/retry and pending-review messages: these describe
current working behavior, not filler. Do not fake a success message or replace a
placeholder with another nonfunctional notice page.

Retire Designs and direct design-gallery routes from the testing application;
preserve designs in documentation or a separate developer-only preview outside
that app. Remove links/routes for unimplemented Sprint 3 and post-Sprint-3 actions
until their flows work. The later November 12 design request restores five tabs: Dashboard, Stats, Track,
Connections, Preferences. Connections alone may temporarily show **Coming Soon...**;
this is not completion of functional connections. Other filler remains prohibited.
Keep tokens, green toolbar, compact layout, focus, safe areas and accessibility.
See STYLE_GUIDE.md's November 12 clarification. Continue this gate through Sprint 3.

An isolated no-login demo may reuse actual food fixtures and real components,
but must not generate filler data or grant backend privileges. Demo success never
proves database persistence or hosted identity integration. Prior requirements to
expand synthetic-food demos are superseded by this human clarification.

### Private-development security/legal deferral

Do not implement or verify SECURE.md/LEGAL.md deliverables during Sprints 2/3.
Policies, legal consent/rights operations, production hardening, comprehensive
attack testing and formal readiness evidence belong wholly after December 12.
Keep Plan-26 through Plan-29 intact and deferred, never marked passed. Remove
unfinished legal/settings actions from the app rather than build fake policies.

Existing safeguards and independently stated AGENTS.md rules remain: secrets and
ignore maintenance, backend-only database access, parameterized SQL, synthetic
personal test data, account ownership, spending/deployment/schema approvals,
adult scope, formula approval boundaries and the visible mathematical-estimate
notice. Sharing choices and catalog review remain functional behavior when those
features ship. AGENTS.md is unchanged; no controls are removed. Private testing
does not itself authorize public access, real-user onboarding or provider writes.

## Sprint 1: Design, foundations, and core tracking (November 1-14)

**Goal:** Design the whole initial experience and deliver a working core diary.

### Plan-01 Foundation and development setup

- **Phase:** S1 W1 | **Due:** 2026-11-07 | **Points:** 5
- **Branch:** `/plan-01` | **Depends on:** None

**Acceptance criteria**

- [x] Frontend React/Vite dev and production build work; backend has a health endpoint and
      documented local start command.
- [x] Frontend provides dev/lint/test/build/format; backend provides dev/lint/test/format.
      Repeatable setup is documented.
- [x] Environment examples contain safe placeholders; .gitignore excludes secrets, dependencies,
      builds, local databases, and uploads.

### Plan-02 Neon development schema and API contracts

- **Phase:** S1 W1 | **Due:** 2026-11-07 | **Points:** 8
- **Branch:** `/plan-02` | **Depends on:** Plan-01

**Acceptance criteria**

- [x] Human approves the development schema, account identity contract, migrations, and API rules
      before application.
- [x] Food, serving, nutrients, account ownership, meal/diary dates, goals, submissions, and
      connections have documented contracts; each feature applies its approved migration when
      requested.
- [x] Neon access stays in the backend with parameterized queries, input validation, synthetic
      seeds, and separate development data as required by AGENTS.md.

Verified 2026-11-09 with human-approved local PostgreSQL only: shared foundation
applied, synthetic fixtures seeded, all five schema designs checked in a
rolled-back transaction. Neon connectivity remains untested and unauthorized.

### Plan-03 Complete initial screen design and app shell

- **Phase:** S1 W1 | **Due:** 2026-11-07 | **Points:** 5
- **Branch:** `/plan-03` | **Depends on:** Plan-01

**Acceptance criteria**

- [x] All initial routes/flows are designed: accounts, dashboard, search/log/edit, scan/manual
      fallback, photo submission/review, goal setup/history, connections, and comparison calendars.
- [ ] Human reviews mobile/wide layouts, navigation, state patterns, and existing design tokens;
      changes follow approval rules.
- [x] Semantic landmarks, visible focus, responsive navigation, and locations for later
      legal/account-rights screens are defined.

### Plan-04 Shared food, form, and state components

- **Phase:** S1 W1 | **Due:** 2026-11-07 | **Points:** 5
- **Branch:** `/plan-04` | **Depends on:** Plan-03

**Acceptance criteria**

- [x] Reusable search, serving, meal, estimate, notice, pending, loading, empty, and error controls
      follow STYLE_GUIDE.md.
- [x] Inputs have visible labels; buttons support focus/disabled/pending states; important errors
      persist beside fields or retry controls.
- [x] Keyboard behavior, user input preservation, validation, and common interactions are tested.

### Plan-05 Account functionality and private ownership

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 13
- **Branch:** `/plan-05` | **Depends on:** Plan-02, Plan-04

**Acceptance criteria**

- [x] Human approves authentication approach/provider, backend hosting, account schema, and API
      rules before adoption or added packages.
- [x] Signup, login, logout, verification/recovery, and expired-session flows work with synthetic
      test accounts; adult 18+ product scope is reflected in the initial UI.
- [x] Normal account switching loads the correct diary and clears previous account UI. Sharing is
      off by default; no home-grown plaintext password store is introduced.

### Plan-06 Seed foods and food queries

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-06` | **Depends on:** Plan-02

**Acceptance criteria**

- [x] Synthetic foods include names, serving basis, calories, protein, fat, carbohydrates, and
      sodium.
- [x] Case-insensitive parameterized search returns bounded results and predictable empty/no-result
      responses.
- [x] Query tests use mocks and never call production or real Neon.

### Plan-07 Dashboard and meal sections

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-07` | **Depends on:** Plan-04

**Acceptance criteria**

- [x] Dashboard shows calorie/macro/sodium summaries and Breakfast, Lunch, Dinner, and Snack
      sections.
- [x] Each meal has an understandable add-food action and useful empty state.
- [x] Headings, controls, realistic long names, and mobile layout are tested.

### Plan-08 Food search API client and hook

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-08` | **Depends on:** Plan-06, Plan-04

**Acceptance criteria**

- [x] Search uses a focused API service/hook, avoids requests on every render, and shows name,
      serving, calories, and macros.
- [x] Loading, error/retry, empty, and no-results states work.
- [x] Hook/client tests use mocked responses, including failed and delayed requests.

### Plan-09 Add food to a meal

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-09` | **Depends on:** Plan-08, Plan-05

**Acceptance criteria**

- [x] User selects a meal and positive serving amount; invalid quantities receive clear field
      feedback.
- [x] Confirmation shows the food, serving, meal, and scaled nutrition.
- [x] Save feedback returns to the tracker; repeated taps do not produce duplicate visible entries.

### Plan-10 Diary persistence and daily totals

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-10` | **Depends on:** Plan-02, Plan-09, Plan-05

**Acceptance criteria**

- [x] Backend creates and retrieves the signed-in synthetic account's entries for a selected local
      diary day.
- [x] Calories, macros, and sodium scale consistently by quantity and aggregate by meal/day; unknown
      nutrients remain unknown.
- [x] Entries preserve serving/nutrition snapshots so later catalog corrections do not rewrite past
      logs.
- [x] Tests cover decimal servings, multiple meals, empty days, and local-day boundaries.

### Plan-11 Tracker integration

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-11` | **Depends on:** Plan-07, Plan-10

**Acceptance criteria**

- [x] Refresh reloads saved entries for the selected day and account.
- [x] Meals list serving/nutrition contributions and update totals after add without a full reload.
- [x] Loading, empty, failed-load/retry, and successful-save flows pass component/integration
      checks.

### Plan-12 Edit and remove diary entries

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-12` | **Depends on:** Plan-11

**Acceptance criteria**

- [x] User edits serving and meal or confirms removal of an entry from their own diary.
- [x] Meal lists and totals update correctly after edits/removal.
- [x] Invalid input, cancel, recoverable errors, and repeated actions have tested behavior.

### Plan-13 Goal formula and outcome specification

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-13` | **Depends on:** Plan-02, Plan-03

**Acceptance criteria**

- [x] Human approval and qualified formula review required by AGENTS.md record source/version,
      biological-sex semantics, age/height/weight units, activity assumptions, supported cases, and
      calculation limits before Plan-19.
- [x] Gain/lose/maintain and muscle-gain objectives, target/range/limit semantics, tolerances,
      effective dates, day completion, and historical edits are specified.
- [x] Unknown/incomplete/no-goal/future-day states and timezone alignment rules are defined; do not
      invent clinical thresholds.

## Sprint 2: Actual food data, logging, scanning and no filler (November 15-28)

**Goal:** Deliver a database-backed application for private testing with actual
food data, working meal logging, real known-product scans/manual lookup, unknown-
product photo intake and no temporary filler by November 28.

### Plan-14A Database, actual catalog and diary testing readiness

- **Phase:** S2 W1 | **Due:** 2026-11-17
- **Branch:** `/plan-14a` | **Depends on:** Plan-05, Plan-06, Plan-12

**Acceptance criteria**

- [x] Human confirms actual food source and representative catalog/search/scan cases. Records have
      product name, serving basis, calories, macros, sodium or explicit unknown, source and correct
      barcode mappings. No generated synthetic foods or invented nutrition/barcodes enter the app.
- [x] Inspect target/migration history; prepare only needed approved imports/catalog changes and
      fictional-food cleanup. Obtain exact approval before application; preserve dependent history.
- [x] Configure approved private tester access and exercise two isolated authenticated test
      accounts through browser -> backend -> Neon. Health checks/mock/demo success are insufficient.
- [x] Verify search, decimal servings, all four meals, local dates, add/edit/remove, correct totals
      and refresh/relogin persistence. Account diaries stay separate; food corrections preserve
      logged serving/nutrition snapshots.
- [x] Check no-results, empty days, unknown nutrients, failed reads/writes, repeated saves, retries
      and date boundaries. Record environment/outcomes/blockers without secrets; keep mocked tests
      separate from approved database checks. Hosted acceptance stays open until actually verified.

Local verification (November 12): human approved the exact 008 migration and
three manufacturer-sourced foods; applied only on the pinned loopback database.
Two isolated accounts passed 59 initial local API/database checks and 56 repeat
checks, including actual-food snapshot preservation, search/no-results, all meals,
decimal totals, mutation retries, edit/remove, account separation, logout/relogin
and date boundaries. Backend unit tests and frontend component/integration tests
pass. Browser UI/physical-device review is pending because CUA has no available
surface; no human visual pass is claimed. Hosted criteria use the local substitute
authorized above; no Neon/Netlify service was contacted. Private detailed evidence
is in contracts/plan-14a.md and private-artifacts/plan14a-verification.json.

### Plan-14 Barcode lookup service

- **Phase:** S2 W1 | **Due:** 2026-11-18 | **Points:** 8
- **Branch:** `/plan-14` | **Depends on:** Plan-06, Plan-10, Plan-14A

**Acceptance criteria**

- [x] Known barcodes return product/serving/nutrition; unknown barcodes return an actionable not-
      found result without creating partial catalog data.
- [x] Supported barcode strings preserve leading zeros with documented normalization/check-digit and
      duplicate rules.
- [x] Tests cover known, unknown, malformed, and leading-zero examples.
- [x] Result/unknown fixtures support compact scanner confirmation and the local demo;
      a lookup alone never saves a diary entry or creates a catalog record.
- [x] Actual supported product barcodes resolve to the correct database food/serving ID.
      Unknown results prompt package-front and nutrition-label submission without an invented match.

Local verification (November 12): approved read-only barcode API, 35 focused
normalization/repository/route tests and 17 local Vite-proxied API checks pass.
Canonical 12/13/14-digit equivalents return the three actual catalog identities;
unknown/invalid inputs and unchanged catalog/diary counts are verified. The
unknown-product photo prompt is completed with its dependent UI/intake, without
inventing a match or exposing a placeholder action.

### Plan-15 Camera scanner and manual fallback

- **Phase:** S2 W1 | **Due:** 2026-11-20 | **Points:** 8
- **Branch:** `/plan-15` | **Depends on:** Plan-14

**Acceptance criteria**

- [x] Camera starts after deliberate user action; manual barcode entry remains available.
- [x] Known matches enter serving/meal confirmation; repeat detections pause and a deliberate save
      logs one entry.
- [x] Denial, unsupported camera, scanner failure, and unknown barcode states explain recovery;
      camera tracks stop on leaving.
- [x] Toolbar barcode and Track shortcuts reach the same scan/manual flow. Reuse serving/meal
      confirmation, preserve selected local date/meal and return to the diary after save.
      Bottom tabs never obscure camera recovery or confirmation controls.
- [ ] Verify decoding on a physical phone in the approved private setup with actual product
      barcodes; record device/browser and supported formats. Manual entry/mocked detections alone
      cannot pass scanner acceptance. Repeated detections and retries create one persisted entry.

Local verification (November 12): camera-session/service tests and scanner,
confirmation, navigation and date/meal integration tests pass. Full frontend
format/lint, 220 tests, build and format check pass. Camera frames are decoded
locally using the human-approved pinned packages; late grants and navigation
release tracks, duplicate detections pause before lookup and save retries keep
one key. Physical-phone decoding is still unchecked pending human local testing;
no camera/device visual pass is claimed.

### Plan-16 Unknown-food photo submission interface

- **Phase:** S2 W2 | **Due:** 2026-11-23 | **Points:** 5
- **Branch:** `/plan-16` | **Depends on:** Plan-14, Plan-04

**Acceptance criteria**

- [x] Form collects barcode, actual package-front photo and actual nutrition-label photo, with
      reviewable product fields. Do not require the user to transcribe the label merely to submit
      photos; a reviewer can enter nutrition from the label in Plan-18. No invented photo values.
- [x] Preview/replace/remove, required fields, basic file limits, pending/upload/error/retry, and
      success states work on mobile and keyboard.
- [x] Pending data is clearly distinct from approved catalog nutrition.
- [x] Stack package/label previews and compact labeled fields on phones; keyboard and tabs
      leave correction/save reachable. Returning to scan/search preserves recoverable input.
      Build with actual manually entered barcodes first; verify the scan-to-intake connection
      by Plan-18A, then publication/reuse in Plan-18.

Local verification (November 12): controlled form/photo components pass five
focused tests covering required photos, preview/replace/remove, file limits,
optional metadata/nutrition, validation, pending controls and preserved retry.
Submission callbacks are mocked; no fake app success or placeholder route is
exposed. Route/back-navigation integration follows the approved Plan-17 service.

Local integration (November 12): unknown scan opens the real form; draft
photos/fields survive return navigation, submission uses the real API client and
opens the persisted status page. Image/API/correction tests pass; actual
manufacturer image persistence is verified in Plan-17. Browser visual testing
remains a human task; no placeholder upload destination is exposed.

### Plan-17 Submission API and review-ready records

- **Phase:** S2 W2 | **Due:** 2026-11-25 | **Points:** 8
- **Branch:** `/plan-17` | **Depends on:** Plan-16, Plan-05

**Acceptance criteria**

- [x] Human approves development image storage and submission schema/API before adoption or applied
      migrations; use actual package/label images containing no personal details.
- [x] Backend stores submission metadata/images with pending, needs-review, approved, and rejected
      states; pending data is not searchable as catalog food.
- [x] Submitter can see status and correct requested fields; basic upload failure/retry and
      duplicate-submission behavior are tested. Review actions arrive with Plan-18 in Sprint 3;
      do not expose inactive review controls or fabricate review outcomes in Sprint 2.
- [x] Menu exposes My submissions with compact status/correction rows, readable text status
      and persistent retry. Show actual persisted submission status in the testing application.

Local verification (November 12): human approved storage/API rules and exact
003 migration, applied only on loopback. Full backend format/lint and 222 tests,
frontend format/lint and 237 tests/build pass. Actual Quaker package/label
photos passed 25 local API/database checks: stored bytes, replay/duplicates,
owner isolation and correction back to pending. Catalog/diary counts unchanged.
All review status labels are tested with mocks; no reviewer/publication API was
implemented. No Neon/Netlify action occurred.

### Plan-18A Sprint 2 core-functionality and no-filler handoff

- **Phase:** S2 W2 | **Due:** 2026-11-28
- **Branch:** `/plan-18a` | **Depends on:** Plan-14A, Plan-14, Plan-15, Plan-16, Plan-17

**Acceptance criteria**

- [ ] Human searches an actual food, confirms servings/meal/day, saves, refreshes, edits and
      removes it; database-backed meal/day calories, macros and sodium agree with serving values.
- [ ] Physical-phone scanning and manual lookup resolve actual known barcode -> catalog ID ->
      confirmation -> one saved diary entry. Check unknown, malformed, leading-zero, camera
      denial, retry, repeated detection/save and date/meal preservation.
- [x] Unknown barcode prompts both photos, and submission/status persist with usable retry.
      Pending photos do not pretend to be catalog food; photo-to-catalog review is due December 5.
- [x] Audit every normal/direct route, navigation item, control, image, metadata and copy against
      the no-filler deadline. No invented food data, fake values, placeholder text/buttons, design
      previews, unfinished destinations or dead actions remain. Keep genuine current-state copy.
- [ ] Frontend lint/test/build/format and backend lint/test/format pass; development services and
      approved database journeys have been exercised. Human checks phone/desktop, keyboard,
      camera, empty/existing isolated accounts and recoverable failures; record evidence/defects.
- [x] Private testing target/access instructions are usable. Hosted journeys remain unpassed
      until verified. Any remote cleanup/import/upload/deploy needs its own exact approval and
      budget; local/demo results cannot stand in for database-backed hosted acceptance.

Local implementation evidence (November 12): unknown scan -> real two-photo
form -> persisted pending record -> owner status/correction passes component
integration tests and 25 local API/database checks with actual manufacturer
photos. App route/transport tests remove fixture/demo access and reject retired
design/future routes; active navigation has four working tabs. The actual catalog
was imported without deleting history. Final package and built-asset audit
results are recorded in the local handoff.

The three unchecked criteria retain their explicit human/physical-device steps:
manual food journey, real phone camera decoding, and human phone/desktop/keyboard
review. Automated portions are implemented and tested locally; no manual pass is
inferred from mocked cameras or the unavailable CUA browser surface. Hosted
portions use the human-approved local substitute and remain deferred.

## Sprint 3 Week 1: Photo-to-catalog, goals, connections and calendars (November 29-December 5)

**Goal:** Complete adding actual foods from submitted photos by halfway through
Sprint 3, finish goals/accountability features and freeze new functionality by
December 5. Keep the working Sprint 2 core and no-filler gate intact.

### Plan-18 Catalog review and reusable publication

- **Phase:** S3 W1 | **Due:** 2026-12-02 | **Points:** 8
- **Branch:** `/plan-18` | **Depends on:** Plan-15, Plan-16, Plan-17

**Acceptance criteria**

- [ ] Human approves reviewer role and publication rules; reviewer can read actual package-front/label
      photos, enter/check nutrition, correct, request changes, approve, or reject. Manual entry
      from the photos is the initial implementation; OCR requires separate approval.
- [ ] Only approved records enter the reusable catalog; competing approvals/duplicate barcodes have
      defined outcomes and provenance.
- [ ] A second synthetic account scans the approved product and logs it; past diary nutrition
      remains unchanged and uploader measurements/identity are not catalog fields.
- [ ] Use a compact review queue, stacked image/nutrition detail and explicit review actions
      above the bottom safe area. Only permitted real actors access review; synthetic demo
      reviewer selection grants no backend privileges. Verify scan -> submit -> review -> reuse.
- [ ] By December 5 at the latest, a submitted actual product is added from its photos to the
      catalog with serving/nutrition/source and barcode mapping; another account scans and logs it.

### Plan-19 Goal menu and estimate acceptance

- **Phase:** S3 W1 | **Due:** 2026-11-30 | **Points:** 13
- **Branch:** `/plan-19` | **Depends on:** Plan-13, Plan-11, Plan-05

**Acceptance criteria**

- [ ] Gain/lose/maintain and muscle-gain menu uses approved biological-sex/height/weight/age inputs
      and any explained activity assumptions.
- [x] Units, conversions, validation, formula explanation, estimate review/edit/decline, and
      deliberate save work; no goal is silently accepted or shared.
- [x] At the result and before save, suggestions are explicitly mathematical estimates and not
      professional medical advice or diagnosis.
- [x] Known reviewed examples, conversions, boundaries, unsupported cases, data states, and
      successful persistence are tested.
- [ ] Daily calorie preferences opens from Menu and Preferences using compact fields and an explicit estimate
      review. Units, assumptions, notice and effective date remain visible on phones. Diary
      summaries show only actual saved targets, without invented allowances or exercise-calorie
      arithmetic. Demo cases reuse the approved calculation utilities.

Local design implementation (November 12): the human approved the frozen formula,
internal technical review, schema/API and palette proposal before implementation.
The reference calculator, manual target, review/save, notices and persistence pass
unit/component and local API checks. The separate original four-objective intent
menu remains outside this narrower three-comparison-mode implementation; the
first criterion is not claimed complete. Phone/harness review in the last
criterion remains unverified. No professional review or hosted pass is claimed.

### Plan-19A Daily summary, macro goals and calorie progress

- **Phase:** S3 W1 | **Target:** before December 5 freeze | **Estimate:** needs review
- **Branch:** `/plan-19a` | **Depends on:** Plan-11, Plan-19

**Acceptance criteria**

- [x] Dashboard uses actual daily intake, saved effective calorie target, bounded
      progress fill, remaining/over-target text and macro grams per DESIGN.md.
      Without a target, recorded values remain available and no goal is invented.
- [x] View daily summary opens the selected day's nutrition-facts-style totals
      and accessible macro-energy pie chart/table; unknown/zero/partial totals,
      units, serving details, rounding and return navigation remain correct.
- [x] Reviewed macro energy/percentage/gram conversion rules and validation are
      documented before implementation; no recommended splits are invented.
- [x] Percentage-of-calories or grams-per-day macro goals support review, deliberate
      save and effective dates without changing historical targets silently.
- [x] Tests cover source totals, missing nutrients, chart accessibility, goal
      modes, boundary/rounding behavior, duplicate saves, persistence and ownership.

Local evidence (November 12): Dashboard progress/no-goal/over-target tests, daily
nutrition/chart/unknown-data tests, goal-unit conversion/review/retry tests and the
five-tab App journey pass. Shared fixed-point outcome and macro calculations are
covered on the backend. Explicit local integration verifies future goal versions,
optional blank macros, replay/conflicts and second-account isolation. Human
layout/assistive-technology review remains in the shared quality gate.

### Plan-20 Accepted connections and selected sharing

- **Phase:** S3 W1 | **Due:** 2026-12-03 | **Points:** 13
- **Branch:** `/plan-20` | **Depends on:** Plan-05, Plan-19

**Acceptance criteria**

- [ ] Human approves discovery, request/accept/decline/remove, report routing, and schema/API rules
      before implementation.
- [ ] Synthetic users can request/accept connections; acceptance alone shares nothing. Explicitly
      selected goal progress can be shared and revoked.
- [ ] Biological sex, age, body measurements, and detailed diaries remain private; removal/blocking
      stop normal subsequent comparison access.
- [ ] Menu opens compact connection/request lists. Sharing review names audience and fields;
      pending/accepted/removed/unavailable states have readable labels. Revoke, remove, block
      and report work by touch/keyboard, including report routing and confirmation. Verify
      these behaviors with isolated synthetic demo actors as well as authenticated accounts.

### Plan-21 Personal goal history, calendar and streaks

- **Phase:** S3 W1 | **Due:** 2026-12-03 | **Points:** 8
- **Branch:** `/plan-21` | **Depends on:** Plan-19, Plan-12

**Acceptance criteria**

- [x] Goal versions/effective dates preserve past targets; changing today's goal does not rewrite
      historical outcomes.
- [x] Calendar implements DESIGN.md's logged-day rule (one saved food), historical
      deficit/surplus/maintain comparisons and exact Light/Regular/Dark bands in
      red/green after qualified review. Missing/no-goal/unknown/future data stays
      neutral with readable text; colors do not claim clinical success.
- [x] Current consecutive logging days and longest consecutive goal-met days use
      documented local-date boundaries, historical goals and recalculation after
      edits/removal; missing data interrupts evidence without being labeled failure.
- [ ] Month/day navigation, readable day-detail/list alternative, text legend, keyboard support,
      zoom, and narrow layout work.
- [x] Tests cover changed goals, edited logs, leap days, local midnight, and timezone/daylight-
      saving behavior.
- [x] The visible mathematical-estimate/not-medical-advice notice is reviewed as initial product
      copy. Formal legal applicability review remains in post-Sprint-3 Plan-28.
- [ ] Stats opens recorded nutrition and personal calendar/history; Menu's Calendar reaches
      the same view. Preserve the diary's selected local date, use compact month/day controls
      and stacked day details, and retain View daily summary on the diary. Synthetic fixtures
      make every calendar state testable without login.

Local evidence (November 12): exact comparison/shade boundaries, historical target
changes, streak gaps, leap/year/local-midnight/DST cases pass shared tests. The
53-group local integration verifies Stats after adding, editing and removing an
actual catalog food, restoring original diary snapshots. Calendar keyboard day
selection/month navigation and selected-day summary pass component/App tests.
Zoom/device review and the original all-state interactive no-login harness remain
unchecked. The human-approved local internal-review exception applies; public
professional/legal review is still deferred.

### Plan-21A Private weight history

- **Phase:** S3 W1 | **Target:** before December 5 freeze | **Estimate:** needs review
- **Branch:** `/plan-21a` | **Depends on:** Plan-05, Plan-21

**Acceptance criteria**

- [x] Human approves exact schema/API, weight-entry/edit/duplicate-date policy,
      units and interval boundaries before adoption/application.
- [x] Stats shows a user-entered dated weight graph below the calendar, with the
      DESIGN.md interval menu, From/To dates and working entry/edit controls.
- [x] Real observations, interval start/latest/change values, table alternative,
      empty/single-point/error/retry states and persistence work without invented
      weigh-ins, clinical claims or disclosure to connections/metadata.
- [ ] Tests cover ownership, conversions, invalid dates/values, interval edges,
      edit/removal, keyboard/zoom and account changes.

Local evidence (November 12): approved migration009 is applied only to loopback;
weight graph/table, empty/single-point/error states, kg/lb display, edit/removal and
interval controls pass component tests. Local API verification checks persistence,
conflicts, ownership and versioned restoration/removal. Ten-year interval bounds
are documented. The combined keyboard/zoom/device criterion is still unchecked.

### Plan-22 Friend progress comparison calendar

- **Phase:** S3 W1 | **Due:** 2026-12-04 | **Points:** 8
- **Branch:** `/plan-22` | **Depends on:** Plan-21, Plan-20

**Acceptance criteria**

- [ ] User selects an accepted connection and date/month to see only selected shared daily goal
      progress alongside their own.
- [ ] Each person is compared to their own historical goal with explicit local-date/timezone
      alignment and readable labels.
- [ ] No-data, incomplete, no-goal, not-shared, unavailable, and met/unmet states stay distinct; no
      ranking, shame, or measurement/diary disclosure.
- [ ] Comparison opens from Stats or an accepted connection. Stack labeled person/day details
      on phones; month/date controls, text legend, day-list alternative and bottom tabs work
      at narrow widths and 200% zoom. Test sharing/revocation and differing timezones in the
      isolated demo too.

### Plan-23A Preferences and appearance

- **Phase:** S3 W1 | **Target:** before December 5 freeze | **Estimate:** needs review
- **Branch:** `/plan-23a` | **Depends on:** Plan-05, Plan-19, Plan-19A

**Acceptance criteria**

- [x] Compact Preferences rows reach genuine My profile, Daily calorie preferences,
      Notifications, Change password and Appearance destinations. Define and approve
      new account/notification/password APIs before adding them; no fake operations.
- [x] Light/Dark modes and Green/Blue/Purple/Red accents use reviewed semantic token
      palettes and a reviewed account-safe persistence mechanism. Existing defaults
      stay until replacement values are approved; no package is implied.
- [ ] All theme/accent combinations keep readable charts, six semantic calendar
      shades, focus, error/loading/disabled controls and safe-area navigation.
- [ ] Changes persist as documented, survive refresh, remain isolated on account
      changes and work with keyboard/zoom; tests cover failure/retry and controls.
- [x] Five tabs and the temporary Connections Coming Soon... page follow DESIGN.md.
      Track offers real search and scanning. No other placeholder is introduced.

Local evidence (November 12): genuine profile/activity/password/appearance controls
pass component tests; the App test navigates all five tabs, preserves the summary
date, saves a theme and clears it on leaving the account. Local API checks verify
saved appearance, conflicts, profile validation and password/session revocation
with the latter sensitive test changes rolled back. Twenty-nine proposed normal-
text contrast combinations pass. All-theme visual/zoom/assistive-technology review
is still pending, so those combined criteria remain unchecked.

### Plan-23 Full initial-feature integration and freeze

- **Phase:** S3 W1 | **Due:** 2026-12-05 | **Points:** 8
- **Branch:** `/plan-23` | **Depends on:** Plan-11, Plan-12, Plan-18A, Plan-18, Plan-19, Plan-19A, Plan-20, Plan-21, Plan-21A, Plan-22, Plan-23A

**Acceptance criteria**

- [ ] Accounts, search/log/edit/remove/totals, scan/manual fallback, upload/review, second-account
      barcode reuse, goals/history, connections, and both calendars are integrated.
- [ ] Every initial route and interaction is implemented with working navigation and data states; no
      future feature is left for Sprint 3 Week 2. Include Plan-19A daily summary,
      Plan-21A weight history and Plan-23A Preferences/themes.
- [ ] Initial designs are fully implemented; frontend lint/test/build/format and backend
      lint/test/format pass with development smoke journeys.
- [ ] Human reviews the feature milestone by December 5; remaining defects have reproduction steps
      and owners. Freeze new feature work.
- [ ] Toolbar, Menu, Dashboard/Stats/Track/Connections/Preferences and contextual return links reach
      all delivered features. Maintain the November 28 no-filler gate; expose Sprint 3 routes
      only once working, and leave later operations absent until implemented.
- [ ] The development-only demo reaches every initial non-authentication journey with synthetic
      actors with actual food records and package/label images, without generated filler. Account
      flows remain separately testable with the local
      API; production ignores the demo switch. Verify both modes before the December 5 freeze.

## Sprint 3 Week 2: Final bug fixes and quality checks (December 6-12)

**Goal:** Reserve the whole second week for stabilization of existing features.

### Plan-24 Final bug fixes and functional regression

- **Phase:** S3 W2 | **Due:** 2026-12-12 | **Points:** 5
- **Branch:** `/plan-24` | **Depends on:** Plan-23

**Acceptance criteria**

- [ ] December 6-12 is used only to fix documented defects, add regression coverage, and verify
      implemented functionality.
- [ ] Full synthetic-user journeys cover diary edits/totals, known/unknown scans, submissions/reuse,
      goal history, connections/sharing, and comparison outcomes.
- [ ] Failed requests, repeated saves, incomplete days, validation, camera denial, and navigation
      recovery are checked; relevant package checks pass.
- [ ] No SECURE.md or LEGAL.md implementation or new feature is scheduled in this week.
- [ ] Regress both demo and authenticated journeys, including date/meal preservation, browser
      back/refresh, bottom-tab transitions and retries.

### Plan-25 Final visual, accessibility, and quality checks

- **Phase:** S3 W2 | **Due:** 2026-12-12 | **Points:** 5
- **Branch:** `/plan-25` | **Depends on:** Plan-23

**Acceptance criteria**

- [ ] Human checks all implemented flows on phone/desktop with keyboard, screen reader, zoom,
      realistic synthetic data, and slow/failing requests.
- [ ] Fix layout, focus, labels, announcements, copy, tokens, mobile keyboard, calendars, and
      unnecessary bundle/performance issues within existing scope.
- [ ] HUMAN.md and STYLE_GUIDE.md functional/presentation criteria pass; later security/legal items
      are explicitly marked deferred rather than passed.
- [ ] Record the internal Sprint 3 handoff, known defects, test evidence, and the separate post-
      Sprint-3 backlog; do not label it public-release approval.
- [ ] Check the implemented reference layout across scan, submission/review, goals, connections
      and calendars: 44px targets, active tabs, safe areas, sticky controls, mobile keyboard,
      long content and 200% zoom. Record defects; initial layout/navigation implementation
      must already have finished by December 5.

## After Sprint 3: Security, legal implementation, and public release

**Starts:** December 13, 2026. Completion dates and capacity are TBD; the human
developer schedules this phase separately. No requirement in this phase is a
Sprint 3 acceptance gate. Public release depends on its completion. Plan-26/27/28
can progress alongside one another after the Sprint 3 handoff, but Plan-29 checks
their combined result before release.

### Plan-26 Data rights and operational privacy implementation

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** 8
- **Branch:** `/plan-26` | **Depends on:** Plan-24, Plan-25

**Acceptance criteria**

- [ ] After December 12, inventory all implemented data: accounts, diaries, photos, reviews,
      measurements, estimates/history, connections, permissions, and reports.
- [ ] Human approves field purposes, retention, access, processors, request/incident owners, and
      deletion/catalog distinctions.
- [ ] Implement reauthenticated export/deletion, processor propagation, backup timing, restoration
      tombstones, withdrawal, session revocation, and relevant UI.
- [ ] Test failures/retry, identity verification, all data categories, and restoration/deletion
      behavior; align notices with actual operations.
- [ ] Rights/request screens use Preferences and the compact mobile shell; identity checks,
      confirmations, progress and retry remain above sticky navigation.

### Plan-27 SECURE.md implementation and verification

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** TBD
- **Branch:** `/plan-27` | **Depends on:** Plan-24, Plan-25

**Acceptance criteria**

- [ ] After December 12, map every applicable SECURE.md requirement to implementation, owner, and
      verification evidence; existing safeguards remain intact.
- [ ] Implement production auth/session/recovery/MFA, backend/object/field authorization,
      CSRF/CORS/CSP/headers/caching, validation/resource/rate limits, and idempotency controls.
- [ ] Harden uploads/storage/downloads, reviewer access/audit, SSRF prevention, privacy
      revocation/caches, and privileged actions.
- [ ] Implement Netlify/Neon environment/secret/TLS/role controls, CI/dependency/secret scanning,
      backups/restore, monitoring, incident response, and reporting contacts.
- [ ] Complete documented ASVS applicability/threat review and attack/cross-account/abuse tests;
      resolve critical/high findings and record approved residual risks.
- [ ] Production authentication hardening, adversarial tests, final policy acceptance, and
      compliance evidence.
- [ ] Production upload hardening, signed-URL abuse testing, quarantine/scanning, retention, and
      processor deletion.
- [ ] Reviewer MFA, comprehensive privilege/abuse verification, and production audit controls.
- [ ] Block/report controls and pending/accepted/removed/unavailable states function; comprehensive
      adversarial permission/cache/race testing.
- [ ] Sharing/revocation and normal data-failure/retry flows work on phone, desktop, and keyboard;
      production attack/race testing.
- [ ] Hardened session/recovery/reviewer UI retains accessible mobile navigation and input
      recovery; production rejects the no-login demo switch and simulated demo roles.

### Plan-28 LEGAL.md implementation and readiness review

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** TBD
- **Branch:** `/plan-28` | **Depends on:** Plan-24, Plan-25

**Acceptance criteria**

- [ ] After December 12, map every applicable LEGAL.md requirement to implementation, reviewed
      applicability, owner, and evidence; retain all requirements.
- [ ] Implement final Privacy/Terms/consumer-health notices, accurate operator contacts,
      acceptance/consent/withdrawal records, and applicable rights/request flows.
- [ ] Complete audience/state/health-data/HIPAA/COPPA/HBNR assessments, claims/formula-copy review,
      retention/vendor/processor contracts, licensing, moderation/takedown, and accessibility legal
      review.
- [ ] Implement any applicable consent/opt-out requirements for adopted services; do not add
      optional tracking merely to satisfy a checklist.
- [ ] Qualified review and tests verify published promises against implemented behavior; unresolved
      applicability and compliance blockers remain explicit.
- [ ] Planned policy/consent locations become reviewed, readable mobile pages through Preferences
      and contextual links; tabs never obscure required choices and notices.

### Plan-29 Post-Sprint-3 public-release gate

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** 13
- **Branch:** `/plan-29` | **Depends on:** Plan-26, Plan-27, Plan-28

**Acceptance criteria**

- [ ] Plan-26/27/28 are complete with evidence. Security and legal implementation changes receive
      functional, accessibility, and human-quality regression checks.
- [ ] Full multi-account journeys pass in a production-like environment with isolated test data;
      Netlify frontend, backend-only Neon, private storage, and operational recovery are verified.
- [ ] Frontend lint/test/build/format and backend lint/test/format pass; no unresolved release-
      blocking security, legal, functional, or quality defects remain.
- [ ] Human developer reviews implementation/evidence, limitations, owners, and residual risks and
      explicitly approves public deployment and real-user onboarding.
- [ ] Repeat toolbar/menu/tab, keyboard/safe-area and screen-reader journeys after Plan-26/27/28
      changes; internal demo success is not production release evidence.

## Handoff checklist

- [ ] November 28: actual database foods, food logging, real scanner/manual lookup, unknown-product
      photo intake and Plan-18A no-filler gate pass with private human-testing evidence.
- [ ] December 5: submitted photos produce a reviewed catalog food/barcode reusable by another
      account; full automatic OCR is not implied.
- [ ] December 5: all initial designs and functional stories pass; record feature freeze.
- [ ] December 6-12: only defect fixes and quality checks; record internal handoff.
- [ ] December 13 onward: implement and verify all SECURE.md and LEGAL.md requirements.
- [ ] Later: repeat affected product tests and obtain public-release approval.

For example, package upload, review, and barcode reuse must work in development
by December 5; known-product scanning/logging and photo intake must already pass
by November 28. Production upload scanning/access hardening and legal content/license
processing are implemented and verified after December 12. Existing AGENTS.md
rules and the original medical-estimate notice apply throughout.
