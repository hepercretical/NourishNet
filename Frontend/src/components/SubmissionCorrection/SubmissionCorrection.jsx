import { useEffect, useRef, useState } from 'react';
import ProductSubmission from '../ProductSubmission/ProductSubmission.jsx';
import { submitProduct } from '../../services/submissions.js';
import { emptySubmission } from '../../utils/submissionDraft.js';

export default function SubmissionCorrection({ submission, onSaved, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    ...emptySubmission(submission.barcode),
    productName: submission.productName || '',
    servingBasis: submission.servingBasis || '',
    nutrients: Object.fromEntries(
      Object.entries(submission.nutrients).map(([name, value]) => [
        name,
        value === null ? '' : String(value),
      ]),
    ),
  }));
  const attempt = useRef(null),
    controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function save(value) {
    if (attempt.current?.draft !== value)
      attempt.current = { draft: value, key: crypto.randomUUID() };
    controller.current = new AbortController();
    return submitProduct(value, {
      id: submission.id,
      revision: submission.revision,
      requestKey: attempt.current.key,
      signal: controller.current.signal,
    });
  }
  return (
    <ProductSubmission
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={save}
      onBack={onCancel}
      onSubmitted={onSaved}
      existingPhotos={submission.photos}
      correcting
    />
  );
}
