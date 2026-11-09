# HUMAN.md

## Delivery-phase clarification approved 2026-11-09

Use the revised schedule in `PLAN.md`: initial design and functionality finish
by Sprint 3 Week 1; Week 2 is reserved for bug fixes, regression tests, and quality
checks. Implement SECURE.md and LEGAL.md requirements only after Sprint 3.

The existing guidance below is preserved. Its security/legal deliverables,
including final policies, privacy rights/export/deletion, consent records, vendor
reviews, and formal release evidence, are checked in the later phase. They do
not block the internal feature milestone. Design their placement with the other
screens, but do not present unfinished operations as working. Human review of
implemented flows, real copy, accessibility, visual consistency, loading/error
states, and mobile interactions still belongs in Sprints 1-3. Use fictional
accounts and synthetic data. Repeat affected reviews after later implementation.

## Purpose
The purpose of this HUMAN.md is to specify practices that should be followed in order to ensure the  project and product does not fall into common issues and mistakes commonly encountered when using AI as well as avoiding design practices that have an "AI" vibe to them.

## Include these practices:

- Display error as toast instead of raw error text.
- Custom 404 Page
- Meta description
- og:image
- Structured data
- Canonical tag
- llms.txt
- favicon
- sitemap.xml
- lang attribute
- alt text
- CTA above the fold
- Meta title per page
- Meta description per page
- robots.txt
- Mobile breakpoints
- Sticky mobile CTA
- Loading states
- Form error states
- Thank-you page
- Privacy policy page
- Terms page
- ookie banner
- Analytics installed
- Real contact address

## Avoid these practices:

- Tapping something twice should not do that thing twice (for example tapping a sign up button or save button twice should not do that thing twice because it could cause issues)
- Keyboard covers input field
- Switching between dark/light mode breaks UI and makes things unreadable
- Hitting the back buttond deletes everything in a field or a form
- Empty view-source
- Browser tab says "Vite" or "React"
- Same page title used everywhere
- More than 1 <h1> tag
- No <h1> tags
- Blocking AI crawlers in robots.txt
- Source maps in production
- Console full of error in web browsers
- Large JS bundles

## Additional practices to include

### Product voice and visual consistency

- Give the product a specific, calm point of view. Use consistent names for
  meals, nutrients, actions, and navigation instead of generic template copy.
- Establish a small visual system and use it consistently: spacing, type scale,
  color roles, corner radii, shadows, icons, illustrations, and interaction
  states must come from shared tokens or documented component variants.
- Make important screens feel intentionally composed. Check alignment, baseline,
  whitespace, density, hierarchy, and responsive behavior at real viewport sizes.
- Use real product copy with helpful examples, not placeholder text, filler
  paragraphs, or unexplained technical language.
- Make every empty state answer three questions: what is empty, why it matters,
  and what the user can do next.
- Make loading, success, validation, permission, not-found, and error states feel
  like part of the product rather than an afterthought.
- Use a consistent icon set and never substitute random emoji or unrelated stock
  icons for product actions.
- Test with realistic names, long food names, decimal serving sizes, large totals,
  slow networks, failed requests, and users who have no data yet.
- Keep the UI honest about uncertainty: show when barcode or OCR data is pending,
  incomplete, or user-entered instead of presenting it as authoritative.

### Attention to detail and accessibility

- Preserve user input during validation and recoverable navigation errors.
- Prevent duplicate submissions with disabled or pending button states, while
  making the result of the first action clear.
- Make focus order, keyboard behavior, touch targets, labels, announcements, and
  contrast part of the design review, not a final patch.
- Respect reduced-motion preferences and avoid animation that delays or blocks a
  task.
- Use realistic responsive breakpoints based on content. Check keyboard behavior
  on mobile, safe areas, sticky actions, and whether dialogs are fully usable.
- Replace raw technical errors with a clear, branded message and a recovery path;
  keep diagnostic details out of the user's view.
- Proofread every public string and check page titles, descriptions, headings,
  favicon, social previews, canonical URLs, structured data, language metadata,
  sitemap, robots policy, and link destinations before release.
- Keep source code and component structure understandable to the next human
  developer. Avoid giant components, unexplained generated files, repeated magic
  values, and abstractions that exist only to look sophisticated.

## Additional practices to avoid

- Do not use a generic “AI dashboard” layout made of identical cards, gradients,
  oversized rounded corners, gratuitous glass effects, or decorative charts that
  do not help a nutrition-tracking task.
- Do not use excessive badges, pills, icons, gradients, confetti, or animations to
  compensate for unclear hierarchy or weak product decisions.
- Do not use fake testimonials, fake reviews, fake activity, fake urgency, or
  invented health outcomes to make the product appear established.
- Do not show “AI-generated” nutrition values as facts, or hide uncertainty behind
  confident copy. Users must be able to tell what came from the database, a scan,
  OCR, or their own entry.
- Do not make every action a primary-color button, make destructive actions look
  safe, or make users hunt for the main action.
- Do not ship with placeholder avatars, lorem ipsum, “John Doe” data, broken
  images, unfinished routes, default Vite titles, or browser console warnings.
- Do not add dark mode, personalization, gamification, or animations unless the
  design is complete across all states and the human developer has approved the
  scope.
- Do not use analytics, session replay, AI, OCR, or third-party widgets without a
  clear product reason, privacy review, and a deliberate user-facing experience.

## Human review gate

Before a release candidate, a human should complete the primary flows on a phone
and desktop using a fresh account and an account with realistic existing data.
Review the first-run experience, search, add/edit/remove, barcode fallback,
upload failure, empty day, network failure, account deletion, and back-button
behavior. Record issues instead of accepting an AI-generated visual or copy pass
without inspection.

## Approved clarifications to the original lists (2026-11-09)

The human developer approved the following qualifications. All original text is
retained. Read the earlier shorthand rules with these qualifications so that
polish does not conflict with privacy, accessibility, or the approved scope.

- "Display error as toast" means use readable product messages instead of raw
  technical errors. Keep validation beside the relevant field, associate it with
  the control, and provide a persistent error/retry region for failed loads.
  Toasts may supplement these, with appropriate announcements; they are never
  the only place to read or recover from an important error.
- "Analytics installed" is conditional on human approval, a useful question to
  answer, privacy/vendor review, and applicable user choice. No tracker is a
  release requirement. Sensitive health and diary data stay out of telemetry.
- "Blocking AI crawlers" does not require access to private areas. Crawlers may
  access only approved public material. Private routes/APIs/uploads require
  authorization; robots.txt is not an access-control mechanism. Public sitemap,
  structured data, llms.txt, canonical tags, and social previews must not expose
  personal data or private routes. llms.txt is optional public documentation.
- "Empty view-source" refers to useful public-page metadata and discoverability;
  it is not a mandate to server-render private React screens or expose diary
  content in HTML. Avoid adding rendering infrastructure without approved scope.
- "ookie banner" refers to a cookie/consent interface only when relevant to the
  actual technologies and legal requirements. Do not show a decorative banner
  claiming compliance while loading unapproved trackers.
- Sticky CTAs and thank-you pages are contextual. Keep the main action reachable
  without obscuring input, focus, error text, or mobile safe areas. A clear inline
  confirmation can complete a routine food log without a separate thank-you page.
- Source maps can be uploaded privately to an approved error service; do not
  publish them or include private user content in diagnostics.
- Private screens need meaningful titles and accessible headings, but must not
  publish identifying metadata/social previews or SEO markup about health data.
- Personalized nutrition goals and private connections are explicitly approved
  product scope. This does not authorize extra gamification, messaging, public
  feeds, leaderboards, or dark mode under the earlier personalization rule.

## Nutrition and accountability should feel considerate

- Make scanning a short, deliberate flow: show the matched product, serving,
  and meal before saving. Pause repeated detections, show one pending result,
  and make it clear when an entry has been saved. Keep manual entry available.
- Show grams/milligrams, serving basis, decimal quantities, missing nutrients,
  and corrections consistently. Unknown sodium is "Not provided," never zero.
  Preserve historical logged nutrition when a catalog record is corrected.
- Make estimation copy visible, brief, and specific. Explain the purpose of
  biological sex, height, weight, and age inputs without assumptions about a
  person's identity. Support the approved unit systems and preserve equivalent
  values on conversion; never silently change a saved target.
- Present weight gain, loss, maintenance, and muscle gain without body-shaming
  language, before/after imagery, guaranteed results, or pressure to restrict.
  Give users a way to review assumptions and edit or decline an estimate.
- Show goal changes with their effective dates. A new goal must not silently
  rewrite old calendar outcomes. Distinguish recorded intake from a complete day
  and distinguish "No data," "Incomplete," "Not shared," and "No goal."
- A friend comparison uses each person's own goal and units. Do not rank people
  by lowest intake, weight lost, body size, or perceived health. Avoid failure
  badges, shame, unsolicited nudges, and competitive streak-loss messaging.
- Label who can see selected progress before enabling sharing. Make removal,
  blocking, reporting, and changing permissions easy to find. Explain unavailable
  comparison data without revealing whether someone blocked a particular user.
- Make calendar navigation usable by touch, keyboard, and screen readers. Offer
  a day-detail/list alternative and a text legend; never encode outcomes only as
  red/green dots. Include month boundaries, leap days, local dates, timezone
  changes, changed goals, and two people with different timezones in review.

## Additional human review evidence

Use fictional, realistic fixtures and record device/browser, task, observation,
and follow-up owner. Review signup/recovery/logout, adult eligibility, profile
units, estimate acceptance/editing, goal history, repeated scan/save, moderation
and later barcode reuse, connection acceptance, sharing/revocation, blocking,
calendar comparisons, export/deletion, zoom, keyboard, and screen-reader behavior.
Do not mark quality complete based solely on generated screenshots or automated
tests; a human must complete the release journeys.
