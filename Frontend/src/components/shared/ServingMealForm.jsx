import { useRef, useState } from 'react';
import { usePendingAction } from '../../hooks/usePendingAction.js';
import { validateMeal, validateServing } from '../../utils/foodForm.js';
import Button from './Button.jsx';
import { ErrorState } from './DataState.jsx';
import ServingInput from './ServingInput.jsx';
import MealSelect from './MealSelect.jsx';

export default function ServingMealForm({
  draft,
  onDraftChange,
  servingBasis,
  onSubmit,
  submitLabel = 'Continue',
  pendingLabel = 'Continuing…',
}) {
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const { pending, failed, run } = usePendingAction();

  function submit(event) {
    event.preventDefault();
    if (pending) return;
    const next = { amount: validateServing(draft.amount), meal: validateMeal(draft.meal) };
    setErrors(next);
    if (next.amount || next.meal) {
      // Query only this form, after the error associations have rendered.
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    return run(() => onSubmit({ amount: Number(draft.amount), meal: draft.meal }));
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-label="Serving and meal"
      aria-busy={pending}
    >
      <div className="shared-form-row">
        <ServingInput
          value={draft.amount}
          onChange={(amount) => onDraftChange({ ...draft, amount })}
          servingBasis={servingBasis}
          error={errors.amount}
          disabled={pending}
        />
        <MealSelect
          value={draft.meal}
          onChange={(meal) => onDraftChange({ ...draft, meal })}
          error={errors.meal}
          disabled={pending}
        />
      </div>
      <Button type="submit" pending={pending} pendingLabel={pendingLabel}>
        {submitLabel}
      </Button>
      {pending && (
        <p className="shared-form-feedback" role="status">
          Please wait. Your serving and meal choices are kept.
        </p>
      )}
      {failed && (
        <ErrorState
          message="This step could not be completed. Your serving and meal choices are kept. Try again."
          onRetry={() => formRef.current.requestSubmit()}
        />
      )}
    </form>
  );
}
