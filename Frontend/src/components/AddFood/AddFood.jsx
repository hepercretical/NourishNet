import { useEffect, useRef, useState } from 'react';
import ServingMealForm from '../ServingMealForm/ServingMealForm.jsx';
import NutritionFacts from '../NutritionFacts/NutritionFacts.jsx';
import Button from '../Button/Button.jsx';
import { ErrorState } from '../DataState/DataState.jsx';
import { usePendingAction } from '../../hooks/usePendingAction.js';
import { displayNutrition, scaleNutrition } from '../../utils/nutrition.js';
import './AddFood.css';

export default function AddFood({
  food,
  draft,
  onDraftChange,
  onBack,
  onSave,
  backLabel = 'Back to search',
}) {
  const [entry, setEntry] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const heading = useRef(null);
  const saved = useRef(false);
  const { pending, failed, run } = usePendingAction();
  useEffect(() => {
    heading.current?.focus();
  }, [entry]);

  function review({ amount, meal }) {
    try {
      if (amount >= 100000000 || !/^\d+(?:\.\d{1,4})?$/.test(String(amount))) {
        setInvalid(
          'Enter a smaller serving amount below 100,000,000 with at most four decimal places.',
        );
        return;
      }
      const nutrients = scaleNutrition(food.nutrients, amount);
      setEntry({
        id: crypto.randomUUID(),
        foodId: food.id,
        servingId: food.servingId,
        name: food.name,
        servingBasis: food.servingBasis,
        amount,
        meal,
        nutrients,
      });
      setInvalid(false);
    } catch {
      setInvalid(
        'This amount cannot be calculated. Enter a smaller serving amount and review again.',
      );
    }
  }

  function save() {
    if (saved.current) return;
    return run(async () => {
      await onSave(entry);
      saved.current = true;
    });
  }

  return (
    <>
      <h1 ref={heading} tabIndex={-1}>
        {entry ? 'Confirm food entry' : 'Choose serving and meal'}
      </h1>
      <h2>{food.name}</h2>
      <p>One serving: {food.servingBasis}</p>
      <p>Save entry records this serving amount in your private diary for the selected date.</p>
      {entry ? (
        <>
          <p>
            {entry.amount} servings × {entry.servingBasis} · {entry.meal}
          </p>
          <section aria-label="Nutrition for selected amount">
            <h2>Nutrition for selected amount</h2>
            <NutritionFacts values={displayNutrition(entry.nutrients)} />
          </section>
          <div className="add-food__actions">
            <Button pending={pending} pendingLabel="Saving…" disabled={failed} onClick={save}>
              Save entry
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setEntry(null)}>
              Edit serving and meal
            </Button>
          </div>
          {failed && (
            <ErrorState
              message="Your entry could not be added. Your choices are kept. Try again."
              onRetry={save}
            />
          )}
        </>
      ) : (
        <>
          <ServingMealForm
            draft={draft}
            onDraftChange={onDraftChange}
            servingBasis={food.servingBasis}
            onSubmit={review}
            submitLabel="Review entry"
          />
          {invalid && <ErrorState message={invalid} />}
          <div className="add-food__actions">
            <Button variant="secondary" onClick={onBack}>
              {backLabel}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
