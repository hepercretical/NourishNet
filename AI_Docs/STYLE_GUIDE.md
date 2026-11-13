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

## Sprint 2 no-placeholder clarification (requested 2026-11-12)

The updated PLAN.md requires actual food records, working database logging and
known-product scanning, and removal of all application filler by November 28.
This supersedes earlier directions here to retain preview links, planned settings/
legal locations, Designs and the Exercise/Weigh-in/Water placeholder sections.
Remove those unfinished surfaces and direct preview routes from the testing app;
keep designs in documentation or a separate developer-only preview outside it.
The later November 12 design request restores five tabs with Connections as the
single approved **Coming Soon...** page; see [DESIGN.md](DESIGN.md). Other unfinished
destinations remain absent. Show other Sprint 3 routes only when usable. Photo submission
intake works in Sprint 2; photo-to-catalog review/reuse is due December 5.

Keep approved tokens, green toolbar, compact layout, safe areas, real controls,
accessibility and genuine loading/empty/error/permission/pending-review messages.
Normal app values come from actual source-backed food records and saved account
data. Do not create synthetic foods, made-up nutrients, fake package photos,
injected diary entries or invented allowances. Existing mocks are separate test
tools, never app data. Earlier requests to expand synthetic-food demos yield to
this clarification. Personal test data remains isolated under AGENTS.md; no real-
user onboarding is authorized. Defer security/legal implementation and verification
until after Sprint 3 while preserving AGENTS.md safeguards and the estimate notice.

## Current screen specification (requested 2026-11-12)

[DESIGN.md](DESIGN.md) is the authoritative screen/behavior specification for the
human's updated screenshots and clarifications. Use it alongside this guide and
PLAN.md. It defines calorie progress/remaining, daily nutrition and macro goals,
the Stats calendar's six shades and logging/streak rules, weight history, the
Track hub, Connections and Preferences/themes. Earlier visual references are
historical; the current requirements below replace conflicting shell directions.
The app's 18+ confirmation belongs in signup, not repeated general app banners.
Formula/goal-rule review and token approval follow the explicit local approvals
recorded in DESIGN.md; later independent review and local-only delivery remain
in force. This update changes guidance, not code or
acceptance completion status.

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

## Current mobile reference and shell contract

Use [DESIGN.md](DESIGN.md) for screen contents, formulas awaiting review, goal
comparison/shade rules and navigation behavior. The human's screenshots establish
compact density and hierarchy; they do not supply application data or approve
unreviewed estimates, palettes, packages or clinical claims.

- Keep one compact toolbar using the selected primary-color tokens, green by
  default, with Menu, Search foods to log and working barcode/diary shortcuts.
- Use a fixed five-item bottom navigation: Dashboard, Stats, Track, Connections,
  Preferences. Emphasize Track. Mark the active item using an icon, text treatment
  and aria-current, never color alone. Recipes and Designs are not app routes.
- Use flat rows and thin borders, compact muted meal headings and aligned values.
  Dashboard order is date, calorie progress/remaining, macro grams, Breakfast,
  Lunch, Dinner, Snack, then View daily summary. Omit Exercise, Water and the old
  Weigh-in placeholder sections. Actual weight entry belongs in Stats.
- Target-based progress uses the saved goal effective that day. Until it exists,
  show recorded totals and No goal set; never fabricate a target or allowance.
- View daily summary opens that day's nutrition-facts-style totals, macro pie
  chart/text alternative and macro goals. Stats opens its monthly calendar,
  private streak counts and user-entered weight graph; these are distinct views.
- Track offers search and scan/manual entry, preserving date and meal. Known
  products use deliberate serving confirmation; unknown products use pending
  two-photo review. Existing camera, retry and duplicate protections remain.
- Connections alone may temporarily show Coming Soon... within the real shell.
  Replace it with working selected-sharing features when Plans 20/22 pass. Keep
  every other unimplemented action out of normal app navigation.
- Preferences uses compact full-width rows for the profile, daily calorie
  preferences, notifications, password change and appearance as each works.
  Later legal/account-rights operations remain absent until implemented.
- Themes support Light/Dark and Green/Blue/Purple/Red accents through reviewed
  semantic tokens. Theme accents never redefine semantic calendar/error colors.
  Preserve existing default tokens until exact alternate palettes are approved.
- Reserve safe-area and bottom-tab space. Inputs, errors, confirmation controls
  and focus must remain visible above the mobile keyboard. At 40rem related
  content may share columns; at 64rem center within the existing content width.
  Never require horizontal scrolling for long names or nutrition rows.

### Development designs and module delivery

Preserve initial designs and their tests in documentation or the isolated
DesignPreviewApp harness outside the normal app entry. Query flags must not
activate synthetic catalog/demo data or bypass real account ownership. Existing
mocks remain isolated test tools; use actual source-backed foods and package photos
for application integration checks. A harness pass does not establish database
persistence, camera decoding, hosted identity or human/device review.

Implement design adaptations within their owning PLAN.md stories and dependencies
before the December 5 freeze. Keep submissions/review, calorie estimates, macro
setup, calendar/person details and settings compact on phones. Preserve input,
focus, units, notices, validation and effective dates through recoverable steps.
December 6-12 is for defects and quality checks, not initial feature construction.

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
[DESIGN.md](DESIGN.md) and the requested acceptance criteria in `PLAN.md`. HUMAN.md's approved
clarifications qualify its earlier shorthand lists. Preserve all established
token values; extending tokens requires human approval. Private screens need
useful titles and accessible headings, with no identifying SEO/social metadata.

### Accounts, goals, and estimation

- The public audience remains adults 18+. Require an unchecked signup eligibility
  checkbox; do not repeat age-gating notices in the general app. Explain
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
