import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button.jsx';
import ServingInput from '../ServingInput/ServingInput.jsx';
import MealSelect from '../MealSelect/MealSelect.jsx';
import NutritionFacts from '../NutritionFacts/NutritionFacts.jsx';
import { displayNutrition, scaleNutrition } from '../../utils/nutrition.js';
import { validateServing } from '../../utils/foodForm.js';
import { usePendingAction } from '../../hooks/usePendingAction.js';

export default function DiaryEntryActions({ entry, onChange }) {
  const [mode, setMode] = useState(null);
  const [amount, setAmount] = useState(String(entry.quantity));
  const [meal, setMeal] = useState(entry.meal[0].toUpperCase() + entry.meal.slice(1));
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const heading = useRef(null);
  const editButton = useRef(null);
  const removeButton = useRef(null);
  const request = useRef(null);
  const returnFocus = useRef(null);
  const { pending, failed, run } = usePendingAction();
  useEffect(() => {
    if (mode) heading.current?.focus();
    else returnFocus.current?.focus();
  }, [mode]);
  function cancel() {
    const button = mode === 'edit' ? editButton : removeButton;
    returnFocus.current = button.current;
    setMode(null);
    setAmount(String(entry.quantity));
    setMeal(entry.meal[0].toUpperCase() + entry.meal.slice(1));
    setError('');
    setConflict(false);
    setAttempted(false);
  }
  const numeric = Number(amount);
  const valid =
    !validateServing(amount) && numeric < 100000000 && /^\d+(?:\.\d{1,4})?$/.test(String(numeric));
  function submit(event) {
    event?.preventDefault();
    if (mode === 'edit' && !valid) {
      setError('Enter a positive amount below 100,000,000 with at most four decimal places.');
      return;
    }
    if (conflict) return;
    setAttempted(true);
    return run(async () => {
      const change = mode === 'edit' ? { quantity: numeric, meal: meal.toLowerCase() } : {};
      const signature = JSON.stringify([mode, change]);
      if (request.current?.signature !== signature)
        request.current = { signature, key: crypto.randomUUID() };
      try {
        await onChange(entry, mode, change, request.current.key);
      } catch (failure) {
        if ([404, 409].includes(failure.status)) setConflict(true);
        throw failure;
      }
    });
  }
  return (
    <>
      <div className="shared-form-row">
        <Button
          ref={editButton}
          variant="secondary"
          disabled={mode !== null}
          onClick={() => setMode('edit')}
        >
          Edit {entry.foodName}
        </Button>
        <Button
          ref={removeButton}
          variant="secondary"
          disabled={mode !== null}
          onClick={() => setMode('remove')}
        >
          Remove {entry.foodName}
        </Button>
      </div>
      {mode && (
        <section aria-label={`${mode === 'edit' ? 'Edit' : 'Remove'} diary entry`}>
          <h3 ref={heading} tabIndex={-1}>
            {mode === 'edit' ? 'Edit' : 'Remove'} {entry.foodName}
          </h3>
          {mode === 'edit' ? (
            <form
              onSubmit={submit}
              noValidate
              aria-label="Edit serving and meal"
              aria-busy={pending}
            >
              <ServingInput
                value={amount}
                onChange={setAmount}
                servingBasis={entry.servingBasis}
                error={error}
                disabled={pending || conflict}
              />
              <MealSelect value={meal} onChange={setMeal} disabled={pending || conflict} />
              {valid && (
                <NutritionFacts
                  values={displayNutrition(scaleNutrition(entry.nutrients, numeric))}
                />
              )}
              <Button
                type="submit"
                pending={pending}
                pendingLabel="Saving changes…"
                disabled={conflict}
              >
                Save changes
              </Button>
            </form>
          ) : (
            <>
              <p>
                Remove {entry.quantity} servings of {entry.foodName} from {entry.meal}? This removes
                only this diary entry.
              </p>
              <Button
                pending={pending}
                pendingLabel="Removing…"
                disabled={conflict}
                onClick={submit}
              >
                Confirm removal
              </Button>
            </>
          )}
          <Button variant="secondary" disabled={pending} onClick={cancel}>
            Cancel
          </Button>
          {failed && attempted && (
            <p role="alert">
              {conflict
                ? 'This entry changed or is unavailable. Cancel and reload the diary before reviewing it again.'
                : 'Your change could not be confirmed. Your choices are kept. Try the action again.'}
            </p>
          )}
        </section>
      )}
    </>
  );
}
