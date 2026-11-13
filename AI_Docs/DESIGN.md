# NourishNet screen and behavior specification

## Human-requested design decisions (2026-11-12)

Read this specification with [STYLE_GUIDE.md](STYLE_GUIDE.md), [PLAN.md](PLAN.md)
and [../AGENTS.md](../AGENTS.md). It captures the supplied mobile screenshots and
the human's subsequent clarifications. It governs implementation and later changes. Local implementation and automated
evidence are recorded in PLAN.md; this document alone is not a test or release pass.
These decisions supersede earlier Designs/Recipes navigation, summary-only Stats,
no-progress-bar, and no-theme directions. The Connections placeholder below is the
only exception to the no-filler rule. Preserve the local-only development/release
boundary, private account ownership and all existing approval requirements.

Use the screenshots for compact layout, hierarchy and interaction patterns. Do
not copy their sample people, food records, calorie allowances, weights, dates,
medical disclaimers, nutrition percentages or health-outcome claims into app data.

## Local implementation approvals and reviewed conventions

The human explicitly approved the exact local schema/API proposal, internal
technical review and palette values in this session on November 12. Migration
009_personal_tracking.sql was applied only to the existing loopback database;
AGENTS.md was not changed. Internal technical review satisfies this local task's
formula/goal-rule review gate by that specific human exception. No independent
professional review or clinical validation is claimed; the later public-release
review remains required. This exception governs references to qualified review
below and in STYLE_GUIDE.md/HUMAN.md for this local implementation only.

The calculator retains the frozen Health Canada EER version from Plan-13; its
[adult formula source](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html)
was rechecked November 12. All eight coefficient rows and unit conversions have
arithmetic tests. There is no automatic gain/loss adjustment. The new calorie-only
calendar rules and logged-day definition below supersede Plan-13's earlier
explicit Finish logging/all-nutrient comparison design; preserve its source,
input-purpose, unsupported-context, version and notice requirements.

Macro conversion uses 4/4/9 kcal per gram (protein/carbohydrate/fat), with
percentages divided by their combined energy. The general factors are documented
in the [FDA Food Labeling Guide](https://www.fda.gov/media/81606/download).
This simplified app convention excludes separate fiber/alcohol factors; it does
not claim to reproduce every food label's energy calculation. Unknown macros
prevent a complete pie/percentage result; all-zero values show an empty state.
Optional goals are either all three personal gram values, all three percentages
totaling exactly 100, or absent. Changing units converts complete draft values
using the entered calorie target, with review before save; incomplete drafts are
kept until the user resolves them. No recommended split is generated. Stored
amounts support four decimals; calculations retain precision and displayed values
use at most two decimals (whole kcal for reference estimates).

The current logging streak ends today, or yesterday while today is unlogged;
otherwise it is zero. Weight rolling intervals include both endpoints; last N
uses today minus N-1 days. Three/six-month intervals clamp the same day of month;
calendar intervals use local month boundaries. Since starting weight begins with
the earliest recorded date. The current weight API bounds a requested interval
to ten years; a longer history requires a reviewed pagination extension. Weight
edits/removals append versions, one active measurement per date; removal retains
history. Profile edits use current-value conflict checks. Password changes verify
the current password and revoke all sessions. Notifications are genuine owned
submission activity, with no fabricated unread count or external delivery.

Exact approved theme tokens live in
[personal.css](../Frontend/src/styles/personal.css), retaining light/green defaults.
They include all four accents, dark surfaces and six independent calendar shades.
Normal-text contrast checks pass for the proposed text/surface pairs. Device,
zoom, screen-reader and all-combination visual review remain human checks.

## Shared shell and navigation

- Use five bottom tabs, in order: **Dashboard**, **Stats**, **Track**,
  **Connections**, **Preferences**. Recipes and Designs are not app tabs.
- Keep a compact primary-color toolbar, thin borders, flat rows, readable units,
  deliberate actions and a raised/emphasized Track action. Green remains the
  default; approved alternate themes use semantic tokens rather than hard-coded
  colors. Retain visible focus, active-tab text/`aria-current`, 44px touch targets,
  device safe areas, keyboard access and 200% zoom/reflow.
- Preserve the selected diary date and meal across search, scanning, confirmation,
  summary and return navigation. Private data clears on logout/account changes.
- Exercise, water and dashboard weigh-in sections are not required. Weight entry
  belongs with the Stats weight graph; do not restore the old placeholder rows.
- Signup includes a required, initially unchecked **I am 18 or older** checkbox.
  Keep eligibility enforcement; do not repeat 18+ badges, banners or age-gating
  copy across sign-in, the diary or other general app screens. Age remains a
  purposeful input in the calorie estimator. Retain the mathematical-estimate
  notice and later reviewed policy disclosures; the audience has not changed.

## Dashboard

Show the selected day's date navigation, a compact calorie summary and progress
bar near the top, grams of protein/carbohydrates/fat, the four meal sections, and
**View daily summary** near the bottom. Keep food serving details, edit/remove
actions and useful empty/error states readable without decorative cards.

Use actual recorded daily calories and the user's saved calorie target effective
on that date. Remaining calories equal target minus recorded calories. Above the
target, show the amount **over target** rather than silently clamping the value or
directing the user to compensate. For surplus goals this still describes distance
to the target; it is not an upper intake limit or a failed goal. The progress bar
describes recorded intake relative to the target, not a health score. Bound its
visual fill to its track while retaining actual totals and excess in text and
accessible descriptions. Do not add burned/exercise calories.

Without a saved, valid target, show recorded intake/macros and **No goal set** with
a working goal-setup action when available. Do not invent a target, remaining
allowance, progress percentage or missing nutrient value. Goal calculation and
acceptance precede enabling target-based progress. View daily summary opens the
selected day's dedicated summary and provides a clear return to that diary day.

## View daily summary

- Use a nutrition-facts-style section with strong rules, aligned nutrient rows,
  clear units and daily totals from all saved foods on the selected date. Label
  it as totals for the day, not the nutrition label for one serving or a claim of
  regulatory certification. Retain food-level serving information in details.
- Include calories, protein, carbohydrate, fat and sodium; show other nutrients
  only when supported by the catalog and aggregation rules. Missing values are
  **Not provided**, not zero. Distinguish known subtotals from complete totals if
  some logged foods lack a nutrient. Do not fabricate micronutrients, net carbs,
  alcohol, calorie-from-fat values or a generic percent Daily Value column.
- Show a pie chart for each macro's percentage of macro-derived calories, with a
  text legend/table giving grams, percentages, and actual versus goal. Percentages
  describe energy, not the percentage of total macro grams. Provide an accessible
  text equivalent and a useful zero/unknown-data state instead of dividing by zero
  or inventing slices. Explain rounding and any difference from food-label calorie
  totals. Formula/factor, carbohydrate/fiber/alcohol handling and missing-data
  conventions must be documented and reviewed before calculation is implemented.
- Users can view and edit macro goals as either **percentage of daily calorie
  target** or **grams per day**. Label the mode, units and corresponding saved
  target clearly; require review and deliberate save. Define percentage allocation,
  mode switching/conversion, validation and rounding before implementation. Never
  silently change calorie goals, invent recommended macro splits or overwrite
  history. Goal changes have effective dates and do not rewrite past summaries.
- Link to Daily calorie preferences for changing the calorie target. Do not copy
  the screenshot's fixed 1,200 target or silently accept an estimate.

## Stats: calendar and streaks

Show the monthly food-logging calendar first, current consecutive logging days
and longest consecutive goal-met days nearby, then the weight graph. Month/date
navigation opens the corresponding diary/summary. Include a readable legend,
keyboard navigation, selected-date announcement and equivalent day-detail/list.

### Logged-day and outcome rules

The human explicitly selected **any day with at least one saved food counts as a
logged day**. Do not require a separate Mark complete action or all four meals.
Evaluate from the saved entries; today can qualify and changes as entries change.
Say **Based on logged foods** so this does not assert that all intake was recorded.
Deleting the last entry removes logged-day status and updates streaks/outcomes.

For a logged day with known calorie totals and a valid historical target `T`, let
`C` be recorded calories. The requested product comparison rules are:

| Saved goal mode | Goal met                            |
| --------------- | ----------------------------------- |
| Deficit         | `C <= T`                            |
| Surplus         | `C >= T`                            |
| Maintain        | `abs(C - T) <= 250 kcal`, inclusive |

Choose green when the rule is met and red when it is outside the rule. Then use
absolute distance from the target, `d = abs(C - T)`, to choose intensity:

| Distance from target | Shade of the chosen color |
| -------------------- | ------------------------- |
| `0 <= d <= 50 kcal`  | Light                     |
| `50 < d <= 100 kcal` | Regular                   |
| `d > 100 kcal`       | Dark                      |

These are the human's exact clarified bands; use unrounded totals for boundaries.
At the target the result is light green. For a 2,000 kcal deficit target, 1,950 is
light green, 1,900 regular green, 1,899 dark green, 2,050 light red, 2,100 regular
red and 2,101 dark red. For maintain, 1,750 and 2,250 are dark green, while 1,749
and 2,251 are dark red. Surplus reverses which side is met, not the shade bands.
This distance-based meaning supersedes the initial qualitative wording that
darker green always means better adherence. Put numeric distance and neutral text
beside colors; a darker shade is not a claim of better health or safer intake.

No entries, unknown totals, no goal, future dates, unavailable/incomplete responses,
or private/unshared friend data have distinct neutral states; never mark them red
or infer calories from absence. One saved food establishes logged status, not
permission to guess unavailable totals. Use each person's goal effective on that
date and their local date/timezone. Do not infer deficit/surplus rules for a
muscle-gain objective without an approved underlying calorie goal mode.

The product comparisons and bands are human-requested, not clinical thresholds.
AGENTS.md still requires qualified review of goal-completion rules before their
implementation. Do not add extra restriction rewards, ranking or health claims.

### Streak semantics

- The logging streak counts consecutive local dates with at least one saved food;
  it does not require a calorie goal or claim the whole day's intake was recorded.
  The approved current-streak convention above allows an unlogged today while
  yesterday ends the streak; always show which date the streak ends on.
- The longest goal streak counts consecutive eligible dates whose own historical
  goals were met. Missing/no-goal/unknown dates interrupt consecutive evidence
  without becoming failed goals. Recalculate after diary edits, removals and
  approved historical corrections. Do not rewrite history with today's goal.
- Streaks are private, descriptive counts with neutral labels, not competitions,
  rankings, guilt prompts or incentives to eat further below/above a target.

## Stats: weight history

Below the calendar, show a graph of weights deliberately entered by that user.
Provide a working weight-entry/edit path here and unit labels/conversions. Offer
interval selection and explicit From/To dates: last 7 days, last 30 days, this
month, previous month, last 3 months, last 6 months, and since starting weight.
Define local-date interval boundaries and starting-weight meaning before coding.

Plot actual dated measurements only. Connect real points without inventing daily
weigh-ins or smoothing that implies unrecorded measurements. Provide a table/text
alternative, empty/single-point states and recoverable loading/save errors. Start,
latest and change values use actual observations in the displayed interval with
dates and units; avoid duplicate-date assumptions or division by an invalid base.
Weight is private and is never shared with connections or exposed in metadata.
Do not praise weight loss/gain or project an outcome from the graph.

## Track

Track is the food-entry hub with working **Search foods** and **Scan barcode**
actions and manual barcode fallback. Reuse existing search and scanner work.
Known barcodes resolve an active catalog ID, then serving/meal/day confirmation,
then one intentional save. Unknown barcodes prompt package-front and nutrition-
label photos for pending review; they do not create reusable food automatically.
Keep the selected date/meal, denied-camera recovery, retry and duplicate guards.

## Connections

Replace the screenshot's Recipes slot with **Connections**. For now its main
content is simply **Coming Soon...**, with the shared navigation and an accessible
page heading/title. This is an explicit human-approved temporary exception to
the no-placeholder rule, not permission for other dead buttons or fake data.
Do not add fake people, request controls, notifications or progress values.

When Plans 20/22 deliver real connections, replace this temporary page with private
accepted connections and a summary of the user's and friends' explicitly shared
goal progress. Acceptance alone shares nothing. Preserve revocation, remove,
block/report, historical goals, neutral missing-data states and the prohibition
on sharing biological sex, age, weight, height or detailed food logs. The temporary
page does not complete acceptance criteria for functional connections/comparison.

## Preferences and daily calorie preferences

Use a compact menu of full-width rows for **My profile**, **Daily calorie
preferences**, **Notifications**, **Change password**, and **Appearance**. Expose
each action only when its destination actually works; Connections is the only
Coming Soon exception. Do not add the reference's Connected apps without scope
approval. Preserve existing working account/submission navigation.

Daily calorie preferences explains and collects the biological sex, weight,
height, age and units needed by the approved estimator, plus any explicitly
approved activity assumptions. Never infer sex from identity or collect unrelated
health details. Explain sensitive input purpose. Show clearly labeled recommended
calorie estimates for the supported goal modes; allow review, editing, declining
and deliberate save of a target with an effective date. Do not copy the screenshot's
example values or promise a weight-change rate.

Formula choice/version, inputs, conversions, assumptions, limits, unsupported
populations and goal rules retain the AGENTS.md human-approval and qualified-review
gate. The supplied screenshots do not select a formula or approve safety limits.
Beside estimates and before save show the mathematical-estimate/not-professional-
medical-advice-or-diagnosis notice. Do not reintroduce general 18+ app banners.

Appearance supports **Light** and **Dark** modes and selectable **Green**, **Blue**,
**Purple** and **Red** accents. Green/light stays the current default until a
different default is explicitly approved. Theme scope is approved; exact palettes
and new token values still need review under AGENTS.md. Use semantic tokens for
all surfaces, text, borders, icons, focus and charts. Accent red must not replace
the calendar's semantic outcome colors. Check every mode/accent combination,
including forms, disabled/error/loading states, previews, charts and contrast.
Save the user's choice through a reviewed persistence design without leaking
another account's preference or flashing unreadable colors. No new theme or
chart package is approved merely by these design instructions.

Profile edits, notifications and password changes must use genuine account-owned
data and reviewed actions. Define notification types, delivery/permissions and
password-change/re-authentication behavior before implementing new API rules.
No push/email provider, tracking SDK or paid resource is selected by this document.

## Delivery and remaining review

[PLAN.md](PLAN.md) assigns these designs to stories and retains dependency order.
All new acceptance criteria start unchecked. December 6-12 remains quality-only;
raise any capacity/scope problem before moving features or claiming completion.
No deployment, remote testing, schema application, dependency or API-rule change
is authorized by this documentation update. Work remains local until the human
approves a specific release.

The local conventions and approvals above resolve the initial calculation,
streak, storage, notification, password and palette decisions. Record any future
change with its source/version and the required human approval. Human device,
zoom, screen-reader and palette-combination review remains pending; professional
review and public-release gates stay deferred, not marked passed.
