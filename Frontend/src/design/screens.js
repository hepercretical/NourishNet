// Navigation and copy for Plan-03 only. No account, diary, or catalog operations run here.
export const primaryRoutes = [
  ['/dashboard', 'Diary'],
  ['/search', 'Add food'],
  ['/scan', 'Scan'],
  ['/goals', 'Goals'],
  ['/connections', 'Connections'],
  ['/calendar', 'Calendar'],
];

export const estimateNotice =
  'These suggestions are estimates calculated using mathematical formulas. They are not professional medical advice or a diagnosis. Your needs may differ. Consult a qualified healthcare professional for advice specific to you.';

// Fields are disabled design examples: no personal data is collected or retained.
export const screens = {
  '/dashboard': {
    title: 'Your daily diary',
    description: 'See recorded nutrition and meals for your selected local day.',
    kind: 'diary',
    links: [
      ['/search', 'Add food'],
      ['/diary/edit', 'Preview entry editing'],
    ],
    empty: 'No foods recorded for this day. Add a food to start your diary.',
  },
  '/search': {
    title: 'Find a food',
    description: 'Search by food name, then check the serving basis before adding it.',
    fields: [['Food name', 'Sample rolled oats']],
    kind: 'food',
    links: [
      ['/food/confirm', 'Review serving and meal'],
      ['/scan', 'Use a barcode instead'],
    ],
    empty: 'No foods match this example search. Try a shorter name or use a barcode.',
  },
  '/food/confirm': {
    title: 'Review your food entry',
    description:
      'Check the food, serving amount, meal, and scaled nutrition before one intentional save.',
    kind: 'food',
    fields: [
      ['Serving amount', '1.5'],
      ['Meal', 'Breakfast'],
    ],
    operation: 'Save entry',
    links: [
      ['/diary/saved', 'Preview saved entry'],
      ['/search', 'Choose a different food'],
    ],
    validation: 'Enter a serving amount greater than zero. Your selected meal stays unchanged.',
    success: 'Example entry saved once. Return to the diary to see its meal contribution.',
  },
  '/diary/saved': {
    title: 'Entry saved',
    description:
      'Example: 1.5 servings of Sample rolled oats added to Breakfast. Repeated taps keep one entry.',
    links: [
      ['/dashboard', 'Return to diary'],
      ['/diary/edit', 'Edit this example entry'],
    ],
    success: 'The diary will update after a successful save without a full page reload.',
  },
  '/diary/edit': {
    title: 'Edit a diary entry',
    description:
      'Sample rolled oats · Breakfast. The original nutrition snapshot stays with this entry.',
    fields: [
      ['Serving amount', '1.5'],
      ['Meal', 'Breakfast'],
    ],
    operation: 'Save changes',
    links: [
      ['/diary/saved', 'Preview updated entry'],
      ['/diary/remove', 'Review removal'],
      ['/dashboard', 'Cancel editing'],
    ],
    validation: 'Enter a serving amount greater than zero before saving changes.',
  },
  '/diary/remove': {
    title: 'Remove this entry?',
    description:
      'Remove only the example Sample rolled oats entry, 1.5 servings, from Breakfast on November 9, 2026. Other entries stay in your diary.',
    operation: 'Remove entry',
    links: [
      ['/diary/edit', 'Keep entry'],
      ['/dashboard', 'Preview diary after removal'],
    ],
  },
  '/scan': {
    title: 'Scan a food barcode',
    description:
      'Use the camera to find a product barcode. Camera access will start only after you choose to start scanning, and stop when you leave.',
    operation: 'Start camera',
    links: [
      ['/scan/match', 'Preview a match'],
      ['/scan/manual', 'Enter barcode manually'],
      ['/scan/unknown', 'Preview unknown barcode'],
    ],
    error: 'Camera access is denied or unavailable. Enter the barcode manually to continue.',
    loading: 'Looking for a barcode. Keep the package steady; manual entry is always available.',
  },
  '/scan/manual': {
    title: 'Enter a barcode',
    description:
      'Type the digits below the barcode, including any leading zeros. You do not need camera access.',
    fields: [['Barcode', '0000000000000']],
    operation: 'Find barcode',
    links: [
      ['/scan/match', 'Preview found product'],
      ['/scan/unknown', 'Preview no match'],
      ['/scan', 'Back to scanner'],
    ],
    validation: 'Check the barcode digits and try again. Keep any leading zeros.',
  },
  '/scan/match': {
    title: 'Barcode matched',
    description:
      'Scanning pauses at a match. Nothing is logged until you review the serving and meal and deliberately save.',
    kind: 'food',
    links: [
      ['/food/confirm', 'Confirm serving and meal'],
      ['/scan', 'Scan another product'],
    ],
  },
  '/scan/unknown': {
    title: 'Product not found',
    description:
      'This example barcode is not in the catalog. Check the digits or submit package photos for review. No partial food record is created.',
    links: [
      ['/scan/manual', 'Check barcode digits'],
      ['/submissions/new', 'Preview food submission'],
    ],
    empty: 'No matching product. Submit the package front and nutrition label for review.',
  },
  '/submissions/new': {
    title: 'Submit a food for review',
    description:
      'Use non-personal sample photos of the package front and nutrition label. Avoid faces, receipts, and addresses. Pending nutrition is not reusable catalog data.',
    kind: 'upload',
    fields: [
      ['Barcode', '0000000000000'],
      ['Product name', 'Sample rolled oats'],
      ['Serving basis', '40 g'],
      ['Calories (kcal)', '150'],
      ['Protein (g)', '5'],
      ['Fat (g)', '3'],
      ['Carbohydrates (g)', '27'],
      ['Sodium (mg, optional)', 'Not provided'],
    ],
    operation: 'Submit for review',
    links: [
      ['/submissions/status', 'Preview submission status'],
      ['/privacy', 'Privacy policy location'],
      ['/terms', 'Terms location'],
    ],
    validation:
      'Add both sample photos, a product name, serving basis, and required nutrition fields. Check file type and size feedback beside each image.',
    error:
      'The sample upload could not finish. Keep your fields and image previews, then retry the failed upload.',
    loading:
      'Uploading sample images. Keep this screen open; duplicate submit actions are disabled.',
  },
  '/submissions/status': {
    title: 'Your submission',
    description:
      'Sample rolled oats · Pending review. It will not appear in food search until a reviewer approves the nutrition record.',
    items: [
      'Pending: waiting for review.',
      'Needs review: replace the unclear label photo and correct requested fields.',
      'Approved: reviewed nutrition can be reused in the catalog; source photos and uploader identity are not public.',
      'Rejected: read the reason and correct the submission if invited.',
    ],
    links: [
      ['/submissions/new', 'Preview requested corrections'],
      ['/review', 'Open reviewer design'],
    ],
  },
  '/review': {
    title: 'Review submitted nutrition',
    description:
      'Reviewer-only screen design. Role checks and publication rules need approval before implementation. Inspect both sample images and verify values before publication.',
    kind: 'upload',
    fields: [
      ['Product name', 'Sample rolled oats'],
      ['Serving basis', '40 g'],
      ['Calories (kcal)', '150'],
      ['Protein (g)', '5'],
      ['Fat (g)', '3'],
      ['Carbohydrates (g)', '27'],
      ['Sodium (mg)', 'Not provided'],
      ['Review note', 'Please provide a clearer label photo.'],
    ],
    items: [
      'Correct values before approval.',
      'Request changes or reject with a useful reason.',
      'Approve only after checking duplicate barcodes and provenance. Existing diary snapshots stay unchanged.',
    ],
    operation: 'Approve catalog record',
    links: [
      ['/submissions/status', 'Preview request changes or rejection'],
      ['/scan/match', 'Preview later catalog reuse'],
    ],
  },
  '/goals': {
    title: 'Choose a goal',
    description:
      'Explore gaining, losing, or maintaining weight, with muscle gain as an additional objective. No outcome is guaranteed.',
    fields: [
      ['Weight objective', 'Maintain weight'],
      ['Additional objective', 'Muscle gain (optional)'],
    ],
    links: [
      ['/goals/setup', 'Review goal inputs'],
      ['/goals/history', 'View goal history'],
    ],
    empty:
      'No goal selected. Review the input explanation to understand how estimates will be prepared.',
  },
  '/goals/setup': {
    title: 'Understand goal inputs',
    description:
      'Biological sex, age, height, and weight are used only as required by the approved mathematical formula. Biological sex is never inferred from your name or gender identity. These inputs remain private.',
    fields: [
      ['Biological sex', 'Options pending formula review'],
      ['Age (years)', 'Adult 18+'],
      ['Height and unit', 'cm or ft/in — pending unit review'],
      ['Weight and unit', 'kg or lb — pending unit review'],
      ['Activity assumption', 'Pending qualified review'],
    ],
    items: [
      'Formula name, version, units, rounding, assumptions, and supported cases will be explained before calculation.',
      'No calculation is available until Plan-13 receives human approval and qualified review. Do not enter personal measurements here.',
    ],
    links: [
      ['/goals/estimate', 'Preview estimate review layout'],
      ['/goals', 'Cancel goal setup'],
    ],
  },
  '/goals/estimate': {
    title: 'Review an estimated goal',
    description:
      'Estimate values are unavailable until formula approval. Review assumptions, limitations, units, and effective date before deciding whether to accept.',
    kind: 'estimate',
    fields: [['Effective date', '2026-11-09']],
    operation: 'Accept and save goal',
    links: [
      ['/goals/setup', 'Edit inputs'],
      ['/goals', 'Decline estimate'],
      ['/goals/history', 'Preview saved goal history'],
    ],
  },
  '/goals/history': {
    title: 'Goal history',
    description:
      'Each saved goal has an effective date. Later changes do not recalculate earlier calendar outcomes using today’s target.',
    items: [
      'November 9, 2026 · Example goal effective date; values await approved calculation.',
      'Earlier dates · No goal. Recorded food can still be shown without an outcome label.',
    ],
    links: [
      ['/goals/setup', 'Preview a goal change'],
      ['/calendar', 'See calendar design'],
    ],
    empty: 'No goal history yet. Choose a goal to review the setup process.',
  },
  '/connections': {
    title: 'Your connections',
    description:
      'Private accepted connections help you share selected goal progress. Sharing starts off; accepting a request does not share anything.',
    fields: [['Find by approved account identifier', 'Discovery rule pending approval']],
    items: [
      'Morgan (fictional) · Accepted · Sharing off.',
      'Casey (fictional) · Incoming request · Accept or decline.',
      'Jordan (fictional) · Outgoing request · Pending acceptance.',
    ],
    links: [
      ['/connections/request', 'Review a connection request'],
      ['/connections/sharing', 'Choose progress to share'],
      ['/connections/manage', 'Manage a connection'],
      ['/calendar/comparison', 'Compare selected progress'],
    ],
    empty: 'No connections yet. Use the approved discovery flow to request a private connection.',
  },
  '/connections/request': {
    title: 'Review connection request',
    description:
      'Casey (fictional) wants to connect. Accepting allows a connection only; your diary, measurements, and goal progress are not automatically shared.',
    operation: 'Accept request',
    links: [
      ['/connections', 'Preview accept or decline result'],
      ['/connections/manage', 'Block or report instead'],
    ],
  },
  '/connections/sharing': {
    title: 'Choose what Morgan can see',
    description:
      'Sharing is off. Only explicitly selected goal progress may be shared with this accepted connection. Biological sex, age, height, weight, and detailed food logs remain private.',
    kind: 'sharing',
    operation: 'Save sharing choices',
    links: [
      ['/connections', 'Cancel sharing changes'],
      ['/connections/manage', 'Revoke existing sharing'],
    ],
  },
  '/connections/manage': {
    title: 'Manage a connection',
    description:
      'Morgan (fictional). Revoking sharing stops future access. It cannot retrieve screenshots or copies already saved by a recipient.',
    items: [
      'Revoke sharing: stop future progress access.',
      'Remove connection: confirm which connection will be removed.',
      'Block: stop requests and access; other people see only a neutral unavailable state.',
      'Report abuse: choose a reason and review before submitting.',
    ],
    fields: [
      ['Report reason', 'Choose a reason'],
      ['Report details', 'Only information needed for review'],
    ],
    operation: 'Confirm removal of Morgan',
    links: [
      ['/connections', 'Keep connection'],
      ['/connections/unavailable', 'Preview unavailable connection'],
    ],
  },
  '/connections/unavailable': {
    title: 'Connection unavailable',
    description:
      'This comparison is unavailable. Return to your connections to choose another person. No private relationship reason is shown.',
    links: [['/connections', 'Return to connections']],
  },
  '/calendar': {
    title: 'Your progress calendar',
    description:
      'Compare recorded progress against your own goal effective on each day. Recorded intake and a complete day are different states.',
    kind: 'calendar',
    links: [
      ['/calendar/comparison', 'Compare with a connection'],
      ['/goals/history', 'Review effective goals'],
    ],
  },
  '/calendar/comparison': {
    title: 'Compare shared progress',
    description:
      'You and Morgan (fictional), each against your own goal effective that day. Only selected shared progress appears; there are no rankings or detailed food logs.',
    kind: 'calendar',
    links: [
      ['/connections/sharing', 'Review sharing choices'],
      ['/calendar', 'Your calendar'],
    ],
  },
  '/account': {
    title: 'Your account',
    description:
      'NourishNet is for adults aged 18 and over. Account screens below are design previews; no credentials are collected.',
    links: [
      ['/account/signup', 'Create an account'],
      ['/account/login', 'Sign in'],
      ['/account/recovery', 'Recover access'],
      ['/account/expired', 'Preview expired session'],
      ['/account/logout', 'Preview sign out'],
      ['/settings', 'Account settings'],
    ],
  },
  '/account/signup': {
    title: 'Create your account',
    description:
      'Confirm you are 18 or older before account and sensitive-data collection. Underage visitors cannot continue. Authentication and eligibility rules need approval in Plan-05.',
    fields: [
      ['Age eligibility', 'I am 18 or older (not selected)'],
      ['Email address', 'Synthetic example only'],
      ['Password', 'Do not enter credentials in this preview'],
    ],
    operation: 'Create account',
    links: [
      ['/account/verify', 'Preview verification'],
      ['/account/login', 'Already have an account?'],
      ['/privacy', 'Privacy policy location'],
      ['/terms', 'Terms location'],
    ],
    validation:
      'Confirm adult eligibility and check the marked fields. An underage visitor cannot create an account.',
  },
  '/account/login': {
    title: 'Sign in',
    description:
      'Use your approved authentication method. Password managers and paste must remain available in the implemented flow.',
    fields: [
      ['Email address', 'Synthetic example only'],
      ['Password', 'Do not enter credentials in this preview'],
    ],
    operation: 'Sign in',
    links: [
      ['/dashboard', 'Preview signed-in diary'],
      ['/account/recovery', 'Forgot your password?'],
    ],
    error: 'We could not sign you in. Check your details or recover account access.',
  },
  '/account/verify': {
    title: 'Check your email',
    description:
      'Verification design: follow the link in the email. Expired or already-used links offer a new verification request without exposing another account.',
    operation: 'Resend verification',
    links: [['/account/login', 'Return to sign in']],
  },
  '/account/recovery': {
    title: 'Recover account access',
    description:
      'Recovery design: if an account matches, instructions will be sent. Never reveal whether an email belongs to someone else.',
    fields: [['Email address', 'Synthetic example only']],
    operation: 'Request recovery',
    links: [
      ['/account/reset', 'Preview reset screen'],
      ['/account/login', 'Return to sign in'],
    ],
  },
  '/account/reset': {
    title: 'Choose a new password',
    description:
      'Reset design: validate the recovery link before showing this form. Invalid or expired links return to recovery.',
    fields: [['New password', 'Do not enter credentials in this preview']],
    operation: 'Save new password',
    links: [
      ['/account/login', 'Preview return to sign in'],
      ['/account/recovery', 'Request a new link'],
    ],
  },
  '/account/expired': {
    title: 'Your session has expired',
    description:
      'Sign in again to continue. Private diary and account UI must clear on expiration or account changes; no previous account data appears during loading.',
    links: [['/account/login', 'Sign in again']],
  },
  '/account/logout': {
    title: 'You are signed out',
    description:
      'Sign-out design: clear private UI and drafts before switching accounts. This preview contains only fictional examples and does not create a session.',
    links: [['/account/login', 'Sign in to another account']],
  },
  '/settings': {
    title: 'Account settings',
    description:
      'Manage account preferences and find later account-rights controls. No settings are saved in this design preview.',
    fields: [
      ['Display units', 'Unit choices pending approval'],
      ['Diary timezone', 'America/Denver (synthetic example)'],
    ],
    links: [
      ['/settings/rights', 'Export or delete account location'],
      ['/privacy', 'Privacy policy location'],
      ['/terms', 'Terms location'],
      ['/account/logout', 'Preview sign out'],
    ],
  },
  '/settings/rights': {
    title: 'Account data and rights',
    description:
      'Planned for after Sprint 3: verified export, correction, account deletion, retention explanation, and support contact. These operations are unavailable; no request is sent here.',
    items: [
      'Export data: identity verification, request status, and retrieval will be designed with retention rules.',
      'Delete account: review scope, confirmation, pending completion, and recovery from failure before a request.',
      'Support contact: a verified business contact will be provided before release.',
    ],
    links: [['/settings', 'Return to settings']],
  },
  '/privacy': {
    title: 'Privacy policy location',
    description:
      'Policy not yet published. This reserved location will explain actual data use, sharing, retention, vendors, and rights after post-Sprint-3 review. This preview is not a privacy policy.',
    links: [['/settings', 'Return to settings']],
  },
  '/terms': {
    title: 'Terms location',
    description:
      'Terms not yet published. Reviewed service terms and operator contact details belong here before public release. This preview is not an agreement or legal consent.',
    links: [['/settings', 'Return to settings']],
  },
};
