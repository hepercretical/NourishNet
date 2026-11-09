# LEGAL.md

## Implementation timing approved 2026-11-09

Implement and verify this document's legal-readiness requirements only after
Sprint 3, in the post-Sprint-3 phase of `PLAN.md` (Plan-26, Plan-28, and Plan-29).
They are not acceptance gates for the initial feature milestone or Sprint 3's
bug-fix/quality week. All existing requirements below are preserved; this timing
clarification governs their project implementation schedule.

Sprints 1-3 are an internal development milestone with synthetic data and sample
uploads. Policy publication, legal consent/acceptance records, privacy rights,
retention/vendor reviews, jurisdictional assessments, and formal compliance
evidence belong to the later phase. Any legal/settings screens designed earlier
must identify unfinished operations honestly; placeholders are not compliance.
Public launch and real-user onboarding follow the later release gate.

The original product requirement that goal suggestions visibly state they are
mathematical estimates, not professional medical advice or diagnosis, remains
part of the initial feature. AGENTS.md's adult audience, approval requirements,
and formula-review gate also remain applicable. This is a project scheduling
decision, not a change to legal obligations or a claim of legal compliance.

## Purpose
The purpose of this LEGAL.md is to specify practices that should be followed in order to ensure the legality of the project and product before it is realeased in any capacity for public use. Please make sure that each rule here is followed and implemented into the project.

## 

## Important limitation

This document is a product-readiness checklist, not legal advice and not a
determination that NourishNet complies with every law. Before public launch, the
human developer or company should have a U.S. privacy/technology attorney review
the product, data flows, contracts, and launch states. Laws vary by state and
change over time; do not copy a threshold or legal conclusion into code without
verifying the current rule.

## Include these practices before public release

### Privacy, notice, and user choice

- Publish a plain-language Privacy Policy that accurately identifies the company,
  contact method, categories of personal information collected (including food
  logs, account data, uploaded images, device data, and inferred information),
  purposes, legal/business reasons, retention, sharing, vendors, security,
  rights, and how users can exercise them.
- Make the Privacy Policy available before collection and link it from account
  creation, settings, upload flows, and the footer. Keep dated versions of policy
  changes and give notice before material changes.
- Publish Terms of Service covering eligibility, acceptable use, account
  responsibilities, intellectual property, user submissions, moderation,
  disclaimers, warranties, limitations of liability, dispute terms, governing
  law, termination, and contact information.
- Provide a real business contact address and a working privacy/security contact.
  Do not use invented contact information or a mailbox that is not monitored.
- Collect only what is necessary, state retention periods, and provide practical
  access, correction, export, deletion, and consent-withdrawal workflows.
- Do not claim “anonymous,” “private,” “secure,” “HIPAA compliant,” or “compliant
  with all laws” unless the claim is accurate, qualified, and reviewed.

### U.S. privacy and health-data considerations

- Inventory every state in which the product will be offered and evaluate state
  comprehensive privacy laws, especially California's CCPA/CPRA and other states'
  consumer privacy, sensitive-data, minor-data, and deletion requirements. The
  CCPA applies only when its current scope and thresholds are met, so verify
  applicability rather than assuming it applies or does not apply.
- Treat food diaries, nutrition goals, uploads, and health-related inferences as
  sensitive data in product design even when HIPAA does not apply.
- Determine whether the FTC Health Breach Notification Rule applies to the app.
  Maintain a written incident process for notifying affected users, the FTC, and
  media when required, in addition to state breach-notification laws.
- Determine whether NourishNet is a HIPAA covered entity or business associate.
  If it operates for a covered health-care entity and handles PHI, use required
  BAAs, HIPAA Privacy/Security/Breach Notification controls, policies, training,
  and documentation. Do not advertise HIPAA compliance based only on encryption.
- If the service is directed to children under 13 or knowingly collects their
  information, comply with COPPA: parental notice and verifiable consent, a
  compliant privacy policy, parental access/deletion controls, security, and
  limited retention. Otherwise, define and enforce an age/eligibility approach
  consistent with counsel's recommendation.
- Do not sell, share, or use sensitive nutrition/health data for targeted
  advertising without a reviewed disclosure, choice mechanism, and lawful basis.
  Honor applicable universal opt-out signals and rights requests where required.

### Nutrition, health, and marketing claims

- State clearly that NourishNet is a tracking and informational tool, not a
  doctor, dietitian, emergency service, diagnosis, treatment, or individualized
  medical advice.
- Avoid disease, weight-loss, treatment, prevention, safety, or clinical accuracy
  claims unless substantiated and reviewed under applicable FTC/FDA rules.
- Explain that database values, barcode matches, OCR results, and user-entered
  values may be incomplete or inaccurate. Show serving basis and label unreviewed
  submissions as pending.
- Provide a clear path to contact support and emergency guidance that does not
  imply the app monitors emergencies.
- Ensure testimonials, influencer content, endorsements, subscription terms, and
  performance claims are truthful, not misleading, and disclose material
  connections.
- Follow CAN-SPAM for commercial email and obtain any required consent for
  marketing messages. Include sender identity, physical postal address, an
  unsubscribe mechanism, and honor opt-outs promptly.

### Accessibility, content, and third parties

- Build an accessible public service using semantic HTML, keyboard access,
  visible focus, labels, text alternatives, captions where needed, contrast, and
  a usable mobile layout. Have counsel assess ADA/Section 508 or other
  accessibility obligations based on the product's audience and business.
- Obtain licenses and retain records for fonts, icons, images, nutrition datasets,
  barcode data, code, and third-party services. Provide required attribution and
  follow each license's conditions.
- Review vendor contracts and data-processing terms for Neon, Netlify, email,
  analytics, error tracking, image storage, OCR/AI, authentication, and payments.
  Disclose processors and international transfers where required.
- Use a written moderation/takedown process for user submissions and respond to
  valid copyright notices under the DMCA if the service hosts user content.
- Do not collect payment-card data unless the product has an approved payment
  provider, terms, refund/cancellation disclosures, tax review, and PCI scope
  assessment. Prefer hosted payment pages.

## Avoid these practices

- Do not launch with placeholder legal pages, copied policies that describe a
  different product, missing company identity, broken links, or unverifiable
  contact details.
- Do not hide collection or sharing in a long policy, pre-check consent boxes,
  bundle unrelated marketing consent into account use, or make deletion needlessly
  difficult.
- Do not retain personal data or uploaded package photos forever, or use them for
  training, advertising, or a new purpose not disclosed to users.
- Do not knowingly accept children under 13 without a COPPA plan and legal review.
- Do not call the app a medical device, medical service, dietitian, or treatment
  provider, and do not give unsafe medical or eating-disorder guidance.
- Do not publish nutrition claims copied from a source without checking its data
  license, accuracy, serving context, and update process.
- Do not promise absolute security, confidentiality, accuracy, availability, or
  legal compliance in marketing or Terms of Service.

## Release evidence

Before launch, keep a dated record of the data inventory, data-flow diagram,
privacy/terms review, consent and rights-request tests, vendor list, accessibility
review, license inventory, security review, breach plan, and the states/audiences
approved for launch. Re-review after material feature, vendor, audience, or law
changes.

## Official starting points

- [FTC Health Breach Notification Rule](https://www.ftc.gov/business-guidance/resources/health-breach-notification-rule-basics-business)
- [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [HHS covered entities and business associates](https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html)
- [California Privacy Protection Agency](https://cppa.ca.gov/)
- [FTC CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)

## Additional public-release requirements (reviewed 2026-11-09)

These additions preserve the original guidance above. They are engineering and
review requirements, not a guarantee of compliance. Record applicability, owner,
evidence, and review date for each item; counsel must resolve legal questions for
the actual business, launch states, vendors, and product behavior. Recheck sources
before launch and material changes.

### Audience and health estimation

- The approved launch audience is adults 18+. Establish a neutral eligibility
  screen before sensitive collection and an underage-account handling process.
  Do not market the product to children. An age checkbox alone does not resolve
  actual knowledge of child users or all state youth-data obligations. If the
  audience changes, reassess the amended COPPA Rule and state requirements before
  collecting minors' data; use current rules, not pre-amendment checklists.
- Display beside goal estimates and before acceptance: "These suggestions are
  estimates calculated using mathematical formulas. They are not professional
  medical advice or a diagnosis. Your needs may differ. Consult a qualified
  healthcare professional for advice specific to you." Final wording needs review.
- Clearly explain biological-sex input, height, weight, age, units, formula,
  activity assumptions, limitations, and rounding. Never promise a rate of weight
  change, muscle gain, diagnosis, or a medically safe intake from these inputs.
- Have a qualified professional review formula choice, permitted adjustments,
  minimum/maximum limits, and situations in which estimates should not be offered
  (including pregnancy, breastfeeding, eating disorders, and relevant conditions).
  Prefer explaining limitations over collecting diagnoses to screen people.
  Disclaimers do not cure an unsafe feature or misleading performance claim.
- Assess the actual intended use and marketing against FDA's current general
  wellness/device guidance. Calling the app a wellness tool alone does not settle
  device status. Reassess before adding treatment, diagnostic, or clinical features.
- Goal-completion labels describe recorded data against a chosen target; they
  must not imply clinical health, treatment success, or moral worth. Avoid features
  that reward under-eating, excessive restriction, or unsafe competitive behavior.

### Consumer health privacy and social sharing

- Add biological sex, age, body measurements, goal estimates/history, connection
  graphs, sharing permissions, daily progress, and inferred health information to
  the data inventory and notices. Record the purpose and retention for each.
- Assess consumer health laws separately from comprehensive privacy thresholds.
  Washington's My Health My Data Act and Nevada's consumer health provisions may
  apply to health-related data outside HIPAA, including small operators. For each
  launch state evaluate scope, exemptions, consent, processor contracts, rights,
  and enforcement; these examples are not an exhaustive U.S. law inventory.
- Where applicable, provide the distinct consumer-health privacy notice and
  homepage link, consent for collection/sharing, separate sale authorization, and
  access/deletion/withdrawal mechanisms required by the relevant law. Do not assume
  a general privacy policy or account acceptance meets these requirements.
- Private accepted connections and explicit selection of shared progress are the
  product baseline. Show who will see which data before sharing. Biological sex,
  age, weight, height, and detailed diaries are not shared. A friendship request
  must not act as blanket authorization for sensitive-data disclosure.
- Provide removal, blocking, reporting, and consent withdrawal without coercion.
  Explain that withdrawal stops future app access but cannot retrieve screenshots
  or copies already saved by recipients. Avoid public search indexing and public
  share URLs for personal data. Do not imply that missing records mean failure.
- Review the FTC Health Breach Notification Rule specifically for the combined
  diet-input and nutrition-database model. It can apply to health apps outside
  HIPAA; unauthorized disclosures to vendors or connections can require incident
  assessment even without hacking. The obsolete 2021 policy statement was
  withdrawn in 2026; use the amended Rule and current guidance. Document legally
  required recipients, triggers, timing, and notice content in an incident matrix.
- Rights requests require proportionate identity verification without unnecessary
  new sensitive data. Track deadlines, appeals where applicable, processor
  propagation, and backup deletion requirements; never promise immediate erasure
  while retaining accessible copies. Define public catalog record treatment
  separately from private account/submission ownership.
- Nonessential cookies, pixels, analytics, session replay, advertising, and cross-
  context tracking need a reviewed purpose and jurisdiction-specific consent or
  opt-out design. A cookie banner is conditional, not blanket legal permission.
  Do not send food logs or health inferences to marketing tools. Honor applicable
  Global Privacy Control signals and do not penalize lawful privacy choices.

### Uploads, community safety, and ownership

- Obtain a narrow, clearly explained license to process submitted package photos
  and nutrition facts for review and catalog use. Do not demand ownership of all
  user content. Tell users to avoid faces, receipts, addresses, and other personal
  details in uploads; strip location metadata and provide a removal/contact path.
- Review packaging photos, trademarks, nutrition dataset/barcode terms, API
  caching/redistribution rights, and attribution before publishing reusable data.
  Factual nutrition values and copyrighted photos/databases raise different issues.
  Approval of a food record does not authorize public distribution of its photos.
- Define reporting and moderation for impersonation, harassment, unsafe nutrition
  submissions, and intellectual-property complaints. Limit moderator access to
  what is needed and provide a correction path for inaccurate catalog records.
- If relying on DMCA safe harbors, have counsel assess agent registration,
  notice/counter-notice procedures, and repeat-infringer policy; hosting user
  content alone does not automatically secure protection.
- Preserve the repository's existing proprietary license. Dependency, dataset,
  and asset licenses need separate review; public availability is not permission
  to copy. This task does not authorize a license change.

### Launch evidence and operational obligations

- Maintain an applicability matrix covering FTC Act claims/privacy promises,
  FTC HBNR, HIPAA status, current COPPA and youth laws, state comprehensive and
  consumer-health privacy laws, state breach laws, accessibility, IP, and any
  approved marketing/payment features. Record reasoned decisions and unresolved
  blockers rather than assuming every statute applies equally.
- Target WCAG 2.2 AA as the engineering baseline and test with keyboard and
  assistive technology. This target does not substitute for counsel's assessment
  of applicable accessibility law or guarantee legal compliance.
- Publish actual policies matching implemented controls and verified operator
  contact information; do not use a developer's home address without a deliberate
  decision. Obtain counsel's advice on enforceable acceptance records, policy
  changes, dispute provisions, and any liability limitations.
- Define health-data retention, vendor agreements, breach response, and ownership
  for requests/reports before launch. Reassess before expanding beyond the U.S.,
  adding payments/marketing, changing vendors, or serving healthcare entities.

### Additional primary sources

- [FTC current HBNR compliance guide](https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0)
- [FTC withdrawal of obsolete policy statement](https://www.ftc.gov/news-events/news/press-releases/2026/09/ftc-withdraws-obsolete-policy-statement)
- [Washington Attorney General consumer health privacy FAQ](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy)
- [Nevada NRS 603A, including consumer health provisions](https://www.leg.state.nv.us/division/legal/lawlibrary/nrs/NRS-603A.html)
- [FTC amended COPPA Rule](https://www.ftc.gov/legal-library/browse/federal-register-notices/16-cfr-part-312-coppa-final-rule-amendments)
- [FDA general wellness guidance, January 2026](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices)
- [FTC health product claims guidance](https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

