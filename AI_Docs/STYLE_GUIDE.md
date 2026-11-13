# NourishNet style guide

## Delivery-phase clarification approved 2026-11-09

Follow `PLAN.md`: initial design/functionality finishes by Sprint 3 Week 1;
Sprint 3 Week 2 is reserved for bug fixes and quality checks. Implement requirements
from SECURE.md and LEGAL.md only after Sprint 3. This timing clarification applies
to security/legal items and release checklists elsewhere in this guide as well.

Design the whole initial experience early, including locations for later legal
pages and account-rights controls. Final policy content, consent records,
export/deletion processing, security hardening, and formal compliance verification
belong to the post-Sprint-3 phase and do not gate the internal feature milestone.
Do not imply an unfinished operation works. Functional sharing controls and
private measurements remain part of the product design. Tokens, semantic controls,
keyboard access, responsive layouts, data states, and human-quality review remain
required throughout Sprints 1-3, as does the visible mathematical-estimate notice
required by AGENTS.md. Repeat affected UI checks after the later implementation.

This guide keeps NourishNet calm, readable, and easy to use on a phone. It is
the source of truth for new UI work. If an existing screen conflicts with this
guide, make the smallest change needed for the requested plan and note follow-up
work rather than redesigning unrelated features.

## Design principles

- **Clear first:** users should understand what to do next without guessing.
- **Calm tracking:** use whitespace and restrained color so totals are easy to scan.
- **Encouraging language:** describe information and choices without judging food.
- **Safe by default:** explain camera permission, uploads, destructive actions,
  and unverified nutrition data before the user commits.
- **Mobile first:** design for a narrow screen, then enhance for larger screens.

## Design tokens

Define tokens in the global stylesheet and use them throughout component CSS. Ask
the human developer before changing established token values.

```css
:root {
  --color-background: #f7faf8;
  --color-surface: #ffffff;
  --color-surface-muted: #eef5f0;
  --color-text: #193027;
  --color-text-muted: #5c6f66;
  --color-primary: #287a55;
  --color-primary-strong: #1d6042;
  --color-on-primary: #ffffff;
  --color-border: #d5e2da;
  --color-success: #23734d;
  --color-warning: #9a6500;
  --color-danger: #b33a3a;
  --color-focus: #1669c7;
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-heading: var(--font-body);
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.75rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --shadow-card: 0 0.25rem 1rem rgb(25 48 39 / 8%);
  --content-max-width: 72rem;
  --touch-target: 2.75rem;
  --toolbar-height: 3.5rem;
  --tab-height: 4.25rem;
  --row-height: 2.75rem;
}
```

If a value is not represented by a token, use the nearest token or add a named
token as part of a planned design change. Do not scatter unexplained literals.

## Layout

- Use a single main column on small screens with `var(--space-4)` side padding.
- Make interactive controls at least 44px tall and separate adjacent tap targets.
- Use cards to group related information, not to wrap every individual label.
- Align nutrition numbers so users can compare them quickly.
- Use a max-width container and comfortable line length on larger screens.
- Prefer CSS Grid for summaries and Flexbox for related controls.

## Mobile diary reference (requested 2026-11-09)

Use the supplied food-diary screenshot as the organizational reference. Retain
the established token values above: the reference approves the layout direction,
not replacement colors or a new token palette. Keep the interface compact and
flat on phones, with fine borders and muted section headers rather than a stack
of spacious, rounded cards. Maintain readable text and 44px tap targets even
where the reference uses smaller controls.

- Top toolbar: primary green background, an expandable Menu button, a prominent
  "Search foods to log" link, barcode preview shortcut, and diary shortcut.
  The search shortcut opens the labeled, functional search form. Menu exposes
  diary, screen designs, goal/connection/calendar previews, and account testing.
- Day strip: previous/next day buttons around a labeled date picker. Preserve
  the selected local day on refresh and show its account timezone. Date changes
  reload that day's entries without showing the previous day's food while loading.
- Nutrition: put recorded calories first, then protein, fat, carbohydrates and
  sodium in a compact grid. Show units and unknown values honestly. Without a
  saved goal, show "No goal"; do not copy the reference's 1,200 allowance, burned
  calories, progress bar, or remaining-calorie arithmetic as invented user data.
- Meals: show Breakfast, Lunch, Dinner, Snack in that order, with a muted heading
  row, an accessible plus link beside the meal name, and recorded meal calories
  when available. Food details, serving basis, edit/remove actions, persistent
  errors, and useful empty instructions remain readable beneath the row.
- Below meals: retain a clearly labeled location for Exercise, Weigh-in and
  Water, followed by View daily summary. These three tracking types are outside
  Sprint 1 and must say so; do not offer active add controls or fabricated logs.
  The summary action moves keyboard focus to the recorded daily nutrition.
- Bottom navigation: five reachable items, Dashboard, Stats, Track, Designs and
  Preferences. Track uses the primary green surface and plus symbol; mark the
  current route with text decoration and `aria-current`, not color alone. Stats
  reaches the diary summary; Designs replaces the reference's Recipes slot
  because recipes are outside the approved scope. Preferences opens its labeled
  design preview. Barcode, goals and social destinations stay honest previews
  until their scheduled implementation.
- Reserve bottom space for navigation and device safe areas. Inputs, errors,
  confirmation controls, and keyboard focus must scroll above it. At 40rem,
  meals may use two columns; at 64rem, center the shell within the existing
  content width. Never require horizontal scrolling for long food names.

### Local testing without login

On the Vite development server, `?demo=1#/app/dashboard` opens an isolated local
demo with synthetic foods and browser-persisted diary entries. It reuses the
Sprint 1 search, confirmation, date, totals, edit and removal UI. Label it visibly
as local synthetic data; no API or database is needed. `?demo=0#/app/login`
retains the actual account/session flows for API testing. Production builds must
ignore the demo switch and continue requiring authenticated API ownership.
The design map remains available without login for all later-sprint screens;
a preview is not completed feature functionality.

### Later-module navigation and layout

Implement these adaptations within the owning modules in PLAN.md before the
December 5 freeze. The final quality week verifies and repairs existing layouts.
Keep five bottom items; do not add a tab for every feature. Track includes
search/scan and reuses serving/meal confirmation. Preserve the selected local
diary date and meal through these flows.

Plan-15 replaces the barcode preview with working scan/manual entry. Menu adds
My submissions (Plan-17), permitted catalog review (Plan-18), Goals (Plan-19),
Connections (Plan-20), and Calendar (Plan-21). Goals also opens from Preferences.
At Plan-21, Stats expands from a summary shortcut to recorded nutrition with
personal calendar/history; keep View daily summary on the diary. Plan-22 adds
comparison from Stats or an accepted connection. Designs remains an internal
screen map; Recipes is outside the approved scope.

Use compact status/request/review lists, stacked package/label previews, visible
estimate-review sections and stacked calendar/person day details on phones.
Reuse shared controls and tokens, text status/legends, headings, persistent retry
and deliberate confirmations. Preserve input and focus across recoverable steps;
tabs and keyboards must not cover fields, errors or save/review controls. Review
phone/wide layouts when each module lands, before its acceptance is completed.

Extend the isolated development demo alongside each feature using synthetic
actors/data and sample images. Demo actor selection never grants real API access;
production ignores demo mode. Test account flows and backend ownership separately.
Policies, data-rights operations and production security UI adopt the same shell
in their post-Sprint-3 modules; keep planned labels until then.

## Reference shell contract

The supplied mobile screenshots are the visual reference for the internal tracker
shell. They establish structure and density, not a replacement color palette:

- Keep one primary green toolbar at the top. It contains a menu button, the
  `Search foods to log` shortcut, and compact barcode and diary shortcuts.
- Use a dark, fixed five-item bottom navigation with Dashboard, Stats, Track,
  Designs, and Preferences. Track is the raised primary action. The active item
  must have `aria-current`, a visible text treatment, and an icon; color alone is
  never the state indicator.
- Use flat list rows and thin borders for diary sections and settings-style lists.
  Reserve rounded surfaces for grouped forms and notices, not every row.
- Keep the diary sequence stable: date navigation, recorded nutrition, Breakfast,
  Lunch, Dinner, Snack, then clearly labeled out-of-scope Exercise, Weigh-in, and
  Water locations. Meal rows use a compact heading, a reachable add-food control,
  and an honest empty or recorded state.
- Use the shared inline icon set for navigation and tracking actions. Icons are
  supporting labels, not substitutes for accessible text. Do not use emoji or
  fallback glyphs that can render as mojibake.
- The reference shell reserves safe-area space beneath the fixed tabs. Toolbar,
  meal rows, settings rows, and action controls remain at least 44px tall even
  when the surrounding layout is compact.

Preferences uses a single column of full-width navigation rows: profile, daily
goals, password recovery, account rights, and policy locations. Mark preview and
planned destinations explicitly. Search uses the existing catalog form; the
reference's freeform speech, restaurant, grocery, history, and recipe features
do not become working tabs through a visual update. Stats retains its Sprint 1
summary shortcut until calendar implementation. Do not copy weight charts or
red/green missed-day counts into previews as real user outcomes.

## Typography and content

- Use sentence case for headings, buttons, labels, and navigation.
- Use one clear page heading and logical subheadings; do not skip heading levels.
- Use readable body line height. Supporting text may be smaller, but essential
  instructions must not be tiny.
- Display units with values: `420 calories`, `24 g protein`, and `680 mg sodium`.
- Use consistent names: Calories, Protein, Fat, Carbohydrates, and Sodium.
- Use action-oriented labels such as “Add food”, “Save entry”, and “Try again”.
- Error messages say what happened and what the user can do next.

## Color and states

- Use primary for the main action and primary-strong for hover or active states.
- Use success, warning, and danger with text or an icon; never rely on color alone.
- Keep text high contrast and check new combinations before shipping.
- Disabled controls should be less prominent but remain readable.
- Keep focus indicators visible:

```css
:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
```

## Components and controls

- Use semantic HTML: buttons for actions, links for navigation, labels for inputs,
  and lists for repeated foods or meals.
- Every input has a visible label or accessible name; placeholder text is not a label.
- Confirm destructive actions and identify exactly what will be removed.
- Dialogs have a title, close action, keyboard support, and focus handling.
- Loading states should preserve layout where possible. Empty states explain how
  to add the first item. Errors offer retry or recovery when possible.

## Nutrition data

- Always show the serving basis beside nutrition values.
- Avoid false precision; use only the precision supported by the data.
- Keep calories prominent, with macros and sodium easy to find but secondary.
- Label unreviewed submissions as pending, never as verified nutrition information.
- Use the same calculation and rounding rules in cards, forms, and totals.

## Responsive behavior

Start narrow. Around 40rem, let summary cards and related controls share a row
when there is room. Around 64rem, use a centered container and wider dashboard.
Breakpoints should respond to content, not a particular device model.

Do not hide essential food, serving, or error information on small screens. Stack
controls when a row becomes cramped and keep the primary action reachable.

## CSS organization

- Keep tokens, reset rules, and base typography in the global stylesheet.
- Keep component rules with the component using names such as `.food-card` and
  `.food-card__serving`.
- Prefer small classes over deeply nested selectors. Avoid `!important`, styling
  by tag name, and magic numbers.
- Use `min()`, `max()`, or `clamp()` when they clarify responsive values.
- Keep page layout in layout/page components and reusable visual behavior in reusable components.

## Testing and review checklist

For every component, test the user's important path using roles or labels and
`userEvent`. Include loading, error, empty, validation, and success states when
applicable. Check keyboard navigation, focus visibility, narrow layout, and
readability at browser zoom.

Before a pull request:

- [ ] New visual values use tokens.
- [ ] Controls have accessible names and keyboard focus.
- [ ] Data screens have loading, error, and empty states.
- [ ] Mobile and wider layouts have been checked.
- [ ] `npm run format`, `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] The change stays within the requested plan and exposes no secrets.

## Security, privacy, and legal presentation

- Never display secrets, tokens, database identifiers, private URLs, full user
  records, or raw server errors in the interface, screenshots, analytics, or
  examples.
- Treat food diaries, nutrition goals, uploads, and health-related inferences as
  sensitive. Ask only for data needed by the current feature and explain why it
  is needed before collection.
- Link to the Privacy Policy and Terms from account creation, settings, uploads,
  and the footer. Keep consent choices clear, unbundled, reversible, and not
  preselected.
- Show camera, upload, analytics, OCR, or AI purpose and status before requesting
  permission or sending data. Never imply that pending or OCR-derived nutrition
  values are verified.
- Use branded, plain-language error and permission states that explain the next
  safe action. Do not expose stack traces, SQL errors, or security-sensitive detail.
- Provide visible contact/support and account export/deletion paths wherever those
  flows are part of the release scope.

## Human-quality release review

- Review the product at phone and desktop sizes with a fresh account and realistic
  existing data. Include long food names, decimal servings, large totals, empty
  days, slow networks, failed requests, denied camera permission, and upload errors.
- Check every route for a meaningful title, description, one `h1`, language
  metadata, favicon, social preview, canonical URL, and a working destination.
- Confirm that first-run, loading, success, error, not-found, validation, pending,
  and deletion states share the same visual language and do not look auto-generated.
- Avoid generic dashboard decoration. Every card, chart, badge, icon, animation,
  and color should help the user understand or complete a nutrition task.
- Proofread all visible copy. Prefer specific NourishNet language over placeholder
  text, framework defaults, vague “Something went wrong” messages, or invented
  claims about health outcomes.

## Alignment and approved scope (2026-11-09)

Read this guide together with `../AGENTS.md`, `SECURE.md`, `LEGAL.md`, `HUMAN.md`,
and the requested acceptance criteria in `PLAN.md`. HUMAN.md's approved
clarifications qualify its earlier shorthand lists. Preserve all established
token values; extending tokens requires human approval. Private screens need
useful titles and accessible headings, with no identifying SEO/social metadata.

### Accounts, goals, and estimation

- The public audience is adults 18+. Use a clear eligibility flow and explain
  sensitive input purpose before collection. Do not expose measurements in
  account discovery, avatars, page titles, or notifications.
- Provide visibly labeled biological-sex, height, weight, age, unit, and approved
  assumption inputs. Do not infer sex from identity. Allow users to understand
  the formula's limitations without requiring diagnoses or unrelated details.
- Distinguish the estimate from the saved goal; provide review, edit, and accept
  actions. Show the formula/assumptions explanation and effective date nearby.
  Require approved calculation and safety rules before implementing the menu.
- At the result and before saving, state clearly that suggestions are estimates
  based on mathematical formulas and are not professional medical advice or
  diagnosis. Do not hide this in a tooltip, footer, or tiny disclaimer.
- Support gain, lose, maintain, and muscle-gain objectives with neutral language.
  Do not imply guaranteed results or portray eating less as automatically better.
- Display calories as kcal with a consistent user-facing label; macros in g and
  sodium in mg. Show missing nutrient values as unavailable. Keep internal
  precision for calculations and apply documented display rounding consistently.
- Explain changed goals and their effective dates; do not redraw past outcomes
  using today's target. Recorded totals and completed logging are distinct states.

### Private connections and calendar comparison

- Sharing starts off. Present connection request/acceptance separately from the
  deliberate selection of progress to share. Show audience and fields before
  enabling sharing; measurements and detailed food logs remain private.
- Offer clear controls to revoke sharing, remove a connection, block, and report.
  Show a neutral unavailable state where giving a reason would reveal private
  relationship information. Do not use public leaderboards or public profiles.
- Compare each person against their own goal effective on that day; show the
  relevant date/timezone and a readable legend. Do not equate missing data,
  an unfinished day, no goal, and withheld information with a missed goal.
- Use text/symbols alongside existing semantic colors and test contrast. Keep
  outcome labels neutral. Specify an accessible keyboard model for the calendar,
  announce selected dates/month changes, and offer a readable day-detail/list
  view that works at 200% zoom and narrow widths.
- Provide loading, retry, empty, pending connection, denied, revoked, and blocked
  states without flashing stale private data or displaying unapproved fields.

### Scanning, submission, and accessible feedback

- Explain camera use before permission, stop camera tracks when leaving the
  scanner, and support manual entry after denial or unsupported-device errors.
- A scan displays product, serving basis, amount, and meal before one intentional
  save. Repeated detections and save retries must visibly stay one operation.
- Show upload preview, replace/remove actions, limits, progress, retry, and pending
  review status. Explain that approved nutrition may enter the shared catalog;
  uploader identity and source photos are private unless separately approved.
- Put persistent field errors beside fields with programmatic associations.
  Page-load errors have a persistent retry path; live-region toasts may supplement
  them. Never show raw server text or rely only on a disappearing notification.
- Preserve input across recoverable errors and navigation, clear sensitive state
  on logout/account changes, and ensure sticky actions do not cover keyboard focus.
- Target WCAG 2.2 AA, including contrast, focus not obscured, reflow, accessible
  authentication, and status announcements. Check reduced motion and screen-reader
  behavior manually. Existing 44px touch targets remain the project convention.

### Additional acceptance checks

- [ ] Estimate notice, input purpose, units, validation, and effective dates are visible.
- [ ] Private fields never appear in connection/calendar responses or metadata.
- [ ] No-data/incomplete/not-shared/no-goal outcomes remain distinct.
- [ ] Repeated scans and rapid saves produce one visible confirmed operation.
- [ ] Revocation/logout clears private UI; blocked users receive no private clues.
- [ ] Calendar and forms work with keyboard, screen reader, zoom, and mobile keyboard.
- [ ] Analytics, crawlers, consent interfaces, and public metadata follow HUMAN.md
      clarifications and the security/legal review rather than template defaults.
