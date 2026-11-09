import { useEffect, useRef, useState } from 'react';
import {
  Button,
  EmptyState,
  ErrorState,
  EstimateSummary,
  FoodCard,
  FormField,
  LoadingState,
  Notice,
  PendingStatus,
  SearchForm,
  ServingMealForm,
} from '../components/shared/index.js';
import { previewAction, sampleFood } from '../design/sharedExamples.js';

export default function SharedComponents() {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState({ amount: '1.5', meal: 'Breakfast' });
  const [outcome, setOutcome] = useState('success');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const interactionRef = useRef(null);
  const previousStep = useRef(selected);

  useEffect(() => {
    if (previousStep.current !== selected) {
      interactionRef.current?.querySelector('form input')?.focus();
      previousStep.current = selected;
    }
  }, [selected]);

  async function search(text) {
    await previewAction(outcome);
    setResults(
      outcome === 'empty' || !sampleFood.name.toLowerCase().includes(text.toLowerCase())
        ? []
        : [sampleFood],
    );
  }

  return (
    <>
      <h1>Shared components</h1>
      <p>
        Try the shared controls with fictional food. Searches and confirmations stay in this
        preview; nothing is saved or sent.
      </p>
      <section ref={interactionRef} className="shared-card" aria-label="Interaction preview">
        <h2>Search, serving, and meal</h2>
        <FormField
          label="Preview response"
          hint="Choose a response before searching or confirming. Each action waits briefly so you can review pending controls."
        >
          {(props) => (
            <select {...props} value={outcome} onChange={(event) => setOutcome(event.target.value)}>
              <option value="success">Successful response</option>
              <option value="error">Recoverable error</option>
              <option value="empty">No results</option>
            </select>
          )}
        </FormField>
        {selected ? (
          <>
            <FoodCard {...sampleFood} />
            <ServingMealForm
              draft={draft}
              onDraftChange={setDraft}
              servingBasis={sampleFood.servingBasis}
              submitLabel="Confirm preview"
              pendingLabel="Confirming preview…"
              onSubmit={async (value) => {
                setConfirmed(null);
                await previewAction(outcome);
                setConfirmed(value);
              }}
            />
            <p className="shared-form-feedback">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelected(false);
                  setConfirmed(null);
                }}
              >
                Back to search
              </Button>
            </p>
            {confirmed && (
              <Notice title="Preview confirmed" tone="success" announce>
                <p>
                  {confirmed.amount} servings of {sampleFood.name} for {confirmed.meal}. Nothing was
                  saved.
                </p>
              </Notice>
            )}
          </>
        ) : (
          <>
            <SearchForm query={query} onQueryChange={setQuery} onSearch={search} />
            <div className="shared-form-feedback">
              {results === null ? (
                <EmptyState title="Find a food to review">
                  Search for oats to see a fictional food, then choose its serving and meal.
                </EmptyState>
              ) : results.length === 0 ? (
                <EmptyState title="No foods found">
                  Try oats, or choose a successful preview response and search again.
                </EmptyState>
              ) : (
                <ul className="shared-preview-results">
                  {results.map((food) => (
                    <li key={food.name}>
                      <FoodCard {...food} onSelect={() => setSelected(true)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
      <section aria-label="Shared feedback examples">
        <h2>Feedback and review</h2>
        <LoadingState />
        <ErrorState message="Foods could not be loaded. Try the interactive search above to review recovery." />
        <PendingStatus />
        <Notice title="Preview complete" tone="success">
          <p>Success feedback stays visible beside the action it describes.</p>
        </Notice>
        <Button disabled>Unavailable action</Button>
      </section>
      <EstimateSummary />
      <a className="design-action" href="#/design">
        Return to screen designs
      </a>
    </>
  );
}
