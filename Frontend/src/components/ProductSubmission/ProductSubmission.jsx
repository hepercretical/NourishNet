import { useEffect, useRef, useState } from 'react';
import { submissionErrors } from '../../utils/submissionDraft.js';
import ProductPhoto from '../ProductPhoto/ProductPhoto.jsx';
import Button from '../Button/Button.jsx';
import { ErrorState } from '../DataState/DataState.jsx';
import './ProductSubmission.css';

const labels = {
  calories: 'Calories (kcal)',
  protein: 'Protein (g)',
  fat: 'Fat (g)',
  carbohydrates: 'Carbohydrates (g)',
  sodium: 'Sodium (mg)',
};
export default function ProductSubmission({
  draft,
  onDraftChange,
  onSubmit,
  onBack,
  onSubmitted,
  existingPhotos,
  correcting = false,
}) {
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const lock = useRef(false);
  const form = useRef(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  function change(name, value) {
    onDraftChange({ ...draft, [name]: value });
    setErrors((previous) => ({ ...previous, [name]: '' }));
  }
  async function submit(event) {
    event?.preventDefault();
    if (lock.current) return;
    const invalid = submissionErrors(draft, { existingPhotos });
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    lock.current = true;
    setPending(true);
    setFailed(false);
    try {
      const result = await onSubmit(draft);
      if (active.current) onSubmitted(result);
    } catch {
      if (active.current) setFailed(true);
    } finally {
      lock.current = false;
      if (active.current) setPending(false);
    }
  }
  function field(name, label, optional = false) {
    return (
      <div className="shared-field" key={name}>
        <label className="shared-field__label" htmlFor={`submission-${name}`}>
          {label}
          {optional ? ' (optional)' : ''}
        </label>
        <input
          id={`submission-${name}`}
          className="shared-field__control"
          value={draft[name]}
          onChange={(event) => change(name, event.target.value)}
          disabled={pending}
          readOnly={correcting && name === 'barcode'}
          aria-invalid={!!errors[name] || undefined}
          aria-describedby={`submission-${name}-error`}
          autoComplete="off"
        />
        <div id={`submission-${name}-error`}>
          {errors[name] && <p role="alert">{errors[name]}</p>}
        </div>
      </div>
    );
  }
  return (
    <>
      <h1>{correcting ? 'Correct your product submission' : 'Submit an unrecognized product'}</h1>
      <p>
        Send a clear photo of the package front and its nutrition label. You do not need to
        transcribe the label. Submitted photos and values stay pending until reviewed; they are not
        searchable catalog food and are not added to your diary.
      </p>
      <form ref={form} onSubmit={submit} className="shared-form product-submission" noValidate>
        {field('barcode', 'Barcode number')}
        {field('productName', 'Product name', true)}
        <ProductPhoto
          kind="front"
          title="Package front photo"
          file={draft.front}
          onChange={(file) => change('front', file)}
          error={errors.front}
          existingUrl={existingPhotos?.front}
          disabled={pending}
        />
        <ProductPhoto
          kind="label"
          title="Nutrition label photo"
          file={draft.label}
          onChange={(file) => change('label', file)}
          error={errors.label}
          existingUrl={existingPhotos?.label}
          disabled={pending}
        />
        <details>
          <summary>Add label details (optional)</summary>
          <p>
            Values describe one serving on the label. Leave an unknown value blank; a reviewer will
            read the photos.
          </p>
          {field('servingBasis', 'Serving size', true)}
          {Object.entries(labels).map(([name, label]) => (
            <div className="shared-field" key={name}>
              <label className="shared-field__label" htmlFor={`submission-${name}`}>
                {label} (optional)
              </label>
              <input
                id={`submission-${name}`}
                className="shared-field__control"
                inputMode="decimal"
                value={draft.nutrients[name]}
                onChange={(event) => {
                  onDraftChange({
                    ...draft,
                    nutrients: { ...draft.nutrients, [name]: event.target.value },
                  });
                  setErrors((previous) => ({ ...previous, [name]: '' }));
                }}
                disabled={pending}
                aria-invalid={!!errors[name] || undefined}
                aria-describedby={`submission-${name}-error`}
              />
              <div id={`submission-${name}-error`}>
                {errors[name] && <p role="alert">{errors[name]}</p>}
              </div>
            </div>
          ))}
        </details>
        <Button type="submit" pending={pending} pendingLabel="Submitting photos…" disabled={failed}>
          Submit for review
        </Button>
        <Button variant="secondary" onClick={onBack} disabled={pending}>
          Back to scan
        </Button>
        {failed && (
          <ErrorState
            message="Your photos could not be submitted. Your choices are kept. Try again."
            onRetry={() => submit()}
          />
        )}
      </form>
    </>
  );
}
