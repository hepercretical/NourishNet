import { useEffect, useRef, useState } from 'react';
import ServingMealForm from '../ServingMealForm/ServingMealForm.jsx';
import NutritionFacts from '../NutritionFacts/NutritionFacts.jsx';
import Button from '../Button/Button.jsx';
import { ErrorState } from '../DataState/DataState.jsx';
import { usePendingAction } from '../../hooks/usePendingAction.js';
import { displayNutrition, scaleNutrition } from '../../utils/nutrition.js';
import './AddFood.css';

export default function AddFood({ food, draft, onDraftChange, onBack, onSave }) {
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
      setInvalid(true);
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
      <p>
        Entries stay in this app session only. Refreshing or signing out clears them. Database
        saving and daily totals arrive in a later update.
      </p>
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
            <Button pending={pending} pendingLabel="Saving…" onClick={save}>
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
          {invalid && (
            <ErrorState message="This amount cannot be calculated. Enter a smaller serving amount and review again." />
          )}
          <div className="add-food__actions">
            <Button variant="secondary" onClick={onBack}>
              Back to search
            </Button>
          </div>
        </>
      )}
    </>
  );
}
