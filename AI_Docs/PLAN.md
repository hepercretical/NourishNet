# NourishNet plan

## Approved delivery schedule

The human developer requested this three-sprint feature schedule on 2026-11-09
and clarified that Sprint 1 began November 1 and Sprint 3 ends December 12.
This replaces the previous seven-sprint schedule. Dates below are targets, not
completion claims. No acceptance criterion is completed by this document update.

| Phase | Dates (2026) | Required outcome |
| --- | --- | --- |
| Sprint 1 | November 1-14 | Complete initial screen/flow design, foundations, accounts, and core tracking |
| Sprint 2 | November 15-28 | Build barcode scanning, photo submissions/review, goals, and connection controls |
| Sprint 3 Week 1 | November 29-December 5 | Finish calendars, integrate every initial feature, and freeze features |
| Sprint 3 Week 2 | December 6-12 | Final bug fixes, regression tests, accessibility/visual/performance quality checks |
| After Sprint 3 | December 13 onward | Implement SECURE.md and LEGAL.md, then approve public release |

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
  connections with selected progress sharing; and personal/friend calendars.
- Implement and verify requirements from SECURE.md and LEGAL.md only AFTER
  Sprint 3. They do not gate initial design, functionality, or the quality week.
  Their detailed requirements remain preserved in those documents. This timing
  also applies to security/legal requirements repeated in HUMAN.md and
  STYLE_GUIDE.md. Plan-20, Plan-28, Plan-29, and Plan-27 implement the later phase.
- Sprints 1-3 deliver an internal development version using synthetic accounts,
  measurements, diaries, and sample photos. A feature-complete internal version
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
- OCR, public profiles/open follows, messaging, leaderboards, payments, advertising,
  and dark mode remain separately approved future work.
- Root AGENTS.md and every applicable AI_Docs/*.md file remain the guidance set.
  This is the only PLAN.md; no root duplicate is maintained.

## Shared initial acceptance criteria

Mark each acceptance criterion as `[x]` when its requirements have been completed
and verified. Leave incomplete or unverified criteria as `[ ]`.

Every applicable initial story includes loading, error, empty, validation, and
success states; accessible controls; responsive UI; useful copy; and user-focused
Vitest/React Testing Library coverage using mocked APIs and userEvent. Tests never
contact real Neon. Runtime development uses the development API/database with
synthetic data. Run frontend dev/lint/test/build/format and backend dev/lint/test/
format once scaffolded; record results honestly. Documentation-only changes use
document, reference, dependency, and formatting checks instead.

Finish the layout and interaction design for all initial screens in Sprint 1,
including space for later legal/settings controls. Final policies and operational
rights controls are not initial functional deliverables; omit or honestly label
unfinished actions. Initial quality review covers implemented flows. Repeat the
relevant reviews after security/legal features are implemented.

Points are retained as relative story estimates where available; they are not
staffing or deadline guarantees. Preserve story IDs for existing references;
implementation order follows sprint placement and dependencies, not ID order.

| ------------------------- | -------------------------------------------------------------------------------- |
| Track                     | Initial delivery responsibility                                                  |
| ------------------------- | -------------------------------------------------------------------------------- |
| Database and Data         | Approved schemas, API contracts, diary/goal history, catalog and connection data |
| Searching, Logging, Logic | Search, totals, scanning, estimates, goal outcomes, calendar comparison          |
| Design, Lists and Quality | All screen designs, forms/navigation, responsive states, integration and testing |
| ------------------------- | ------------------------------------------------------------------------------- |

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

- [ ] Human approves the development schema, account identity contract, migrations, and API rules
      before application.
- [ ] Food, serving, nutrients, account ownership, meal/diary dates, goals, submissions, and
      connections have documented contracts; each feature applies its approved migration when
      requested.
- [ ] Neon access stays in the backend with parameterized queries, input validation, synthetic
      seeds, and separate development data as required by AGENTS.md.

### Plan-03 Complete initial screen design and app shell

- **Phase:** S1 W1 | **Due:** 2026-11-07 | **Points:** 5
- **Branch:** `/plan-03` | **Depends on:** Plan-01

**Acceptance criteria**

- [ ] All initial routes/flows are designed: accounts, dashboard, search/log/edit, scan/manual
      fallback, photo submission/review, goal setup/history, connections, and comparison calendars.
- [ ] Human reviews mobile/wide layouts, navigation, state patterns, and existing design tokens;
      changes follow approval rules.
- [ ] Semantic landmarks, visible focus, responsive navigation, and locations for later
      legal/account-rights screens are defined.

### Plan-06 Shared food, form, and state components

- **Phase:** S1 W1 | **Due:** 2026-11-07 | **Points:** 5
- **Branch:** `/plan-06` | **Depends on:** Plan-03

**Acceptance criteria**

- [ ] Reusable search, serving, meal, estimate, notice, pending, loading, empty, and error controls
      follow STYLE_GUIDE.md.
- [ ] Inputs have visible labels; buttons support focus/disabled/pending states; important errors
      persist beside fields or retry controls.
- [ ] Keyboard behavior, user input preservation, validation, and common interactions are tested.

### Plan-19 Account functionality and private ownership

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 13
- **Branch:** `/plan-19` | **Depends on:** Plan-02, Plan-06

**Acceptance criteria**

- [ ] Human approves authentication approach/provider, backend hosting, account schema, and API
      rules before adoption or added packages.
- [ ] Signup, login, logout, verification/recovery, and expired-session flows work with synthetic
      test accounts; adult 18+ product scope is reflected in the initial UI.
- [ ] Normal account switching loads the correct diary and clears previous account UI. Sharing is
      off by default; no home-grown plaintext password store is introduced.
- [ ] Production authentication hardening, adversarial tests, final policy acceptance, and
      compliance evidence are explicitly deferred to Plan-28/29.

### Plan-04 Seed foods and food queries

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-04` | **Depends on:** Plan-02

**Acceptance criteria**

- [ ] Synthetic foods include names, serving basis, calories, protein, fat, carbohydrates, and
      sodium.
- [ ] Case-insensitive parameterized search returns bounded results and predictable empty/no-result
      responses.
- [ ] Query tests use mocks and never call production or real Neon.

### Plan-05 Dashboard and meal sections

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-05` | **Depends on:** Plan-06

**Acceptance criteria**

- [ ] Dashboard shows calorie/macro/sodium summaries and Breakfast, Lunch, Dinner, and Snack
      sections.
- [ ] Each meal has an understandable add-food action and useful empty state.
- [ ] Headings, controls, realistic long names, and mobile layout are tested.

### Plan-07 Food search API client and hook

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-07` | **Depends on:** Plan-04, Plan-06

**Acceptance criteria**

- [ ] Search uses a focused API service/hook, avoids requests on every render, and shows name,
      serving, calories, and macros.
- [ ] Loading, error/retry, empty, and no-results states work.
- [ ] Hook/client tests use mocked responses, including failed and delayed requests.

### Plan-08 Add food to a meal

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-08` | **Depends on:** Plan-07, Plan-19

**Acceptance criteria**

- [ ] User selects a meal and positive serving amount; invalid quantities receive clear field
      feedback.
- [ ] Confirmation shows the food, serving, meal, and scaled nutrition.
- [ ] Save feedback returns to the tracker; repeated taps do not produce duplicate visible entries.

### Plan-09 Diary persistence and daily totals

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-09` | **Depends on:** Plan-02, Plan-08, Plan-19

**Acceptance criteria**

- [ ] Backend creates and retrieves the signed-in synthetic account's entries for a selected local
      diary day.
- [ ] Calories, macros, and sodium scale consistently by quantity and aggregate by meal/day; unknown
      nutrients remain unknown.
- [ ] Entries preserve serving/nutrition snapshots so later catalog corrections do not rewrite past
      logs.
- [ ] Tests cover decimal servings, multiple meals, empty days, and local-day boundaries.

### Plan-10 Tracker integration

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 8
- **Branch:** `/plan-10` | **Depends on:** Plan-05, Plan-09

**Acceptance criteria**

- [ ] Refresh reloads saved entries for the selected day and account.
- [ ] Meals list serving/nutrition contributions and update totals after add without a full reload.
- [ ] Loading, empty, failed-load/retry, and successful-save flows pass component/integration
      checks.

### Plan-11 Edit and remove diary entries

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-11` | **Depends on:** Plan-10

**Acceptance criteria**

- [ ] User edits serving and meal or confirms removal of an entry from their own diary.
- [ ] Meal lists and totals update correctly after edits/removal.
- [ ] Invalid input, cancel, recoverable errors, and repeated actions have tested behavior.

### Plan-21 Goal formula and outcome specification

- **Phase:** S1 W2 | **Due:** 2026-11-14 | **Points:** 5
- **Branch:** `/plan-21` | **Depends on:** Plan-02, Plan-03

**Acceptance criteria**

- [ ] Human approval and qualified formula review required by AGENTS.md record source/version,
      biological-sex semantics, age/height/weight units, activity assumptions, supported cases, and
      calculation limits before Plan-22.
- [ ] Gain/lose/maintain and muscle-gain objectives, target/range/limit semantics, tolerances,
      effective dates, day completion, and historical edits are specified.
- [ ] Unknown/incomplete/no-goal/future-day states and timezone alignment rules are defined; do not
      invent clinical thresholds.
- [ ] The visible mathematical-estimate/not-medical-advice notice is reviewed as initial product
      copy. Formal legal applicability review remains post-Sprint-3.

## Sprint 2: Barcode, submissions, goals, and connections (November 15-28)

**Goal:** Deliver the remaining product workflows before calendar integration.

### Plan-13 Barcode lookup service

- **Phase:** S2 W1 | **Due:** 2026-11-21 | **Points:** 8
- **Branch:** `/plan-13` | **Depends on:** Plan-04, Plan-09

**Acceptance criteria**

- [ ] Known barcodes return product/serving/nutrition; unknown barcodes return an actionable not-
      found result without creating partial catalog data.
- [ ] Supported barcode strings preserve leading zeros with documented normalization/check-digit and
      duplicate rules.
- [ ] Tests cover known, unknown, malformed, and leading-zero examples.

### Plan-14 Camera scanner and manual fallback

- **Phase:** S2 W1 | **Due:** 2026-11-21 | **Points:** 8
- **Branch:** `/plan-14` | **Depends on:** Plan-13

**Acceptance criteria**

- [ ] Camera starts after deliberate user action; manual barcode entry remains available.
- [ ] Known matches enter serving/meal confirmation; repeat detections pause and a deliberate save
      logs one entry.
- [ ] Denial, unsupported camera, scanner failure, and unknown barcode states explain recovery;
      camera tracks stop on leaving.

### Plan-15 Unknown-food photo submission interface

- **Phase:** S2 W1 | **Due:** 2026-11-21 | **Points:** 5
- **Branch:** `/plan-15` | **Depends on:** Plan-14, Plan-06

**Acceptance criteria**

- [ ] Form collects barcode, package-front sample image, nutrition-label sample image, and
      reviewable product/nutrition fields.
- [ ] Preview/replace/remove, required fields, basic file limits, pending/upload/error/retry, and
      success states work on mobile and keyboard.
- [ ] Pending data is clearly distinct from approved catalog nutrition.

### Plan-16 Submission API and review-ready records

- **Phase:** S2 W2 | **Due:** 2026-11-28 | **Points:** 8
- **Branch:** `/plan-16` | **Depends on:** Plan-15, Plan-19

**Acceptance criteria**

- [ ] Human approves development image storage and submission schema/API before adoption or applied
      migrations; use non-personal sample images.
- [ ] Backend stores submission metadata/images with pending, needs-review, approved, and rejected
      states; pending data is not searchable as catalog food.
- [ ] Submitter can see status and correct requested fields; basic upload failure/retry and
      duplicate-submission behavior are tested.
- [ ] Production upload hardening, signed-URL abuse testing, quarantine/scanning, retention, and
      processor deletion are Plan-28/20 work after Sprint 3.

### Plan-26 Catalog review and reusable publication

- **Phase:** S2 W2 | **Due:** 2026-11-28 | **Points:** 8
- **Branch:** `/plan-26` | **Depends on:** Plan-16

**Acceptance criteria**

- [ ] Human approves reviewer role and publication rules; reviewer can inspect sample images/values,
      correct, request changes, approve, or reject.
- [ ] Only approved records enter the reusable catalog; competing approvals/duplicate barcodes have
      defined outcomes and provenance.
- [ ] A second synthetic account scans the approved product and logs it; past diary nutrition
      remains unchanged and uploader measurements/identity are not catalog fields.
- [ ] Reviewer MFA, comprehensive privilege/abuse verification, and production audit controls are
      Plan-28 work.

### Plan-22 Goal menu and estimate acceptance

- **Phase:** S2 W2 | **Due:** 2026-11-28 | **Points:** 13
- **Branch:** `/plan-22` | **Depends on:** Plan-21, Plan-10, Plan-19

**Acceptance criteria**

- [ ] Gain/lose/maintain and muscle-gain menu uses approved biological-sex/height/weight/age inputs
      and any explained activity assumptions.
- [ ] Units, conversions, validation, formula explanation, estimate review/edit/decline, and
      deliberate save work; no goal is silently accepted or shared.
- [ ] At the result and before save, suggestions are explicitly mathematical estimates and not
      professional medical advice or diagnosis.
- [ ] Known reviewed examples, conversions, boundaries, unsupported cases, data states, and
      successful persistence are tested.

### Plan-24 Accepted connections and selected sharing

- **Phase:** S2 W2 | **Due:** 2026-11-28 | **Points:** 13
- **Branch:** `/plan-24` | **Depends on:** Plan-19, Plan-22

**Acceptance criteria**

- [ ] Human approves discovery, request/accept/decline/remove, report routing, and schema/API rules
      before implementation.
- [ ] Synthetic users can request/accept connections; acceptance alone shares nothing. Explicitly
      selected goal progress can be shared and revoked.
- [ ] Biological sex, age, body measurements, and detailed diaries remain private; removal/blocking
      stop normal subsequent comparison access.
- [ ] Block/report controls and pending/accepted/removed/unavailable states function; comprehensive
      adversarial permission/cache/race testing is deferred to Plan-28.

## Sprint 3 Week 1: Calendars and complete integration (November 29-December 5)

**Goal:** Finish all initial design and functionality and freeze features by December 5.

### Plan-23 Personal goal history and calendar

- **Phase:** S3 W1 | **Due:** 2026-12-05 | **Points:** 8
- **Branch:** `/plan-23` | **Depends on:** Plan-22, Plan-11

**Acceptance criteria**

- [ ] Goal versions/effective dates preserve past targets; changing today's goal does not rewrite
      historical outcomes.
- [ ] Calendar shows each day's recorded nutrition versus its effective goal, with distinct
      met/unmet, missing/incomplete, no-goal, and future states.
- [ ] Month/day navigation, readable day-detail/list alternative, text legend, keyboard support,
      zoom, and narrow layout work.
- [ ] Tests cover changed goals, edited logs, leap days, local midnight, and timezone/daylight-
      saving behavior.

### Plan-25 Friend progress comparison calendar

- **Phase:** S3 W1 | **Due:** 2026-12-05 | **Points:** 8
- **Branch:** `/plan-25` | **Depends on:** Plan-23, Plan-24

**Acceptance criteria**

- [ ] User selects an accepted connection and date/month to see only selected shared daily goal
      progress alongside their own.
- [ ] Each person is compared to their own historical goal with explicit local-date/timezone
      alignment and readable labels.
- [ ] No-data, incomplete, no-goal, not-shared, unavailable, and met/unmet states stay distinct; no
      ranking, shame, or measurement/diary disclosure.
- [ ] Sharing/revocation and normal data-failure/retry flows work on phone, desktop, and keyboard;
      production attack/race testing remains Plan-28 work.

### Plan-17 Full initial-feature integration and freeze

- **Phase:** S3 W1 | **Due:** 2026-12-05 | **Points:** 8
- **Branch:** `/plan-17` | **Depends on:** Plan-10, Plan-11, Plan-26, Plan-25

**Acceptance criteria**

- [ ] Accounts, search/log/edit/remove/totals, scan/manual fallback, upload/review, second-account
      barcode reuse, goals/history, connections, and both calendars are integrated.
- [ ] Every initial route and interaction is implemented with working navigation and data states; no
      future feature is left for Sprint 3 Week 2.
- [ ] Initial designs are fully implemented; frontend lint/test/build/format and backend
      lint/test/format pass with development smoke journeys.
- [ ] Human reviews the feature milestone by December 5; remaining defects have reproduction steps
      and owners. Freeze new feature work.

## Sprint 3 Week 2: Final bug fixes and quality checks (December 6-12)

**Goal:** Reserve the whole second week for stabilization of existing features.

### Plan-12 Final bug fixes and functional regression

- **Phase:** S3 W2 | **Due:** 2026-12-12 | **Points:** 5
- **Branch:** `/plan-12` | **Depends on:** Plan-17

**Acceptance criteria**

- [ ] December 6-12 is used only to fix documented defects, add regression coverage, and verify
      implemented functionality.
- [ ] Full synthetic-user journeys cover diary edits/totals, known/unknown scans, submissions/reuse,
      goal history, connections/sharing, and comparison outcomes.
- [ ] Failed requests, repeated saves, incomplete days, validation, camera denial, and navigation
      recovery are checked; relevant package checks pass.
- [ ] No SECURE.md or LEGAL.md implementation or new feature is scheduled in this week.

### Plan-18 Final visual, accessibility, and quality checks

- **Phase:** S3 W2 | **Due:** 2026-12-12 | **Points:** 5
- **Branch:** `/plan-18` | **Depends on:** Plan-17

**Acceptance criteria**

- [ ] Human checks all implemented flows on phone/desktop with keyboard, screen reader, zoom,
      realistic synthetic data, and slow/failing requests.
- [ ] Fix layout, focus, labels, announcements, copy, tokens, mobile keyboard, calendars, and
      unnecessary bundle/performance issues within existing scope.
- [ ] HUMAN.md and STYLE_GUIDE.md functional/presentation criteria pass; later security/legal items
      are explicitly marked deferred rather than passed.
- [ ] Record the internal Sprint 3 handoff, known defects, test evidence, and the separate post-
      Sprint-3 backlog; do not label it public-release approval.

## After Sprint 3: Security, legal implementation, and public release

**Starts:** December 13, 2026. Completion dates and capacity are TBD; the human
developer schedules this phase separately. No requirement in this phase is a
Sprint 3 acceptance gate. Public release depends on its completion. Plan-20/28/29
can progress alongside one another after the Sprint 3 handoff, but Plan-27 checks
their combined result before release.

### Plan-20 Data rights and operational privacy implementation

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** 8
- **Branch:** `/plan-20` | **Depends on:** Plan-12, Plan-18

**Acceptance criteria**

- [ ] After December 12, inventory all implemented data: accounts, diaries, photos, reviews,
      measurements, estimates/history, connections, permissions, and reports.
- [ ] Human approves field purposes, retention, access, processors, request/incident owners, and
      deletion/catalog distinctions.
- [ ] Implement reauthenticated export/deletion, processor propagation, backup timing, restoration
      tombstones, withdrawal, session revocation, and relevant UI.
- [ ] Test failures/retry, identity verification, all data categories, and restoration/deletion
      behavior; align notices with actual operations.

### Plan-28 SECURE.md implementation and verification

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** TBD
- **Branch:** `/plan-28` | **Depends on:** Plan-12, Plan-18

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

### Plan-29 LEGAL.md implementation and readiness review

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** TBD
- **Branch:** `/plan-29` | **Depends on:** Plan-12, Plan-18

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

### Plan-27 Post-Sprint-3 public-release gate

- **Phase:** Post-Sprint-3 | **Due:** TBD | **Points:** 13
- **Branch:** `/plan-27` | **Depends on:** Plan-20, Plan-28, Plan-29

**Acceptance criteria**

- [ ] Plan-20/28/29 are complete with evidence. Security and legal implementation changes receive
      functional, accessibility, and human-quality regression checks.
- [ ] Full multi-account journeys pass in a production-like environment with isolated test data;
      Netlify frontend, backend-only Neon, private storage, and operational recovery are verified.
- [ ] Frontend lint/test/build/format and backend lint/test/format pass; no unresolved release-
      blocking security, legal, functional, or quality defects remain.
- [ ] Human developer reviews implementation/evidence, limitations, owners, and residual risks and
      explicitly approves public deployment and real-user onboarding.

## Handoff checklist

- [ ] December 5: all initial designs and functional stories pass; record feature freeze.
- [ ] December 6-12: only defect fixes and quality checks; record internal handoff.
- [ ] December 13 onward: implement and verify all SECURE.md and LEGAL.md requirements.
- [ ] Later: repeat affected product tests and obtain public-release approval.

For example, package upload, review, and barcode reuse must work in development
by December 5. Production upload scanning/access hardening and legal content/license
processing are implemented and verified after December 12. Existing AGENTS.md
rules and the original medical-estimate notice apply throughout.
