import { useRef, useState } from 'react';
import { useFoodSearch } from '../../hooks/useFoodSearch.js';
import SearchForm from '../SearchForm/SearchForm.jsx';
import FoodCard from '../FoodCard/FoodCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../DataState/DataState.jsx';
import AddFood from '../AddFood/AddFood.jsx';

export default function FoodSearch({ onSave, initialMeal = '' }) {
  const [query, setQuery] = useState('');
  const searchPanel = useRef(null);
  const [selected, setSelected] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [draft, setDraft] = useState({ amount: '1', meal: initialMeal });
  const { status, foods, term, search } = useFoodSearch();
  return (
    <>
      {choosing && (
        <AddFood
          key={selected.servingId}
          food={selected}
          draft={draft}
          onDraftChange={setDraft}
          onBack={() => {
            setChoosing(false);
            requestAnimationFrame(() => searchPanel.current?.querySelector('input')?.focus());
          }}
          onSave={onSave}
        />
      )}
      <div ref={searchPanel} hidden={choosing}>
        <h1>Search foods</h1>
        <p>Find a synthetic food, then choose its serving amount and meal.</p>
        <SearchForm query={query} onQueryChange={setQuery} onSearch={search} />
        <section aria-label="Food search results" aria-busy={status === 'loading'}>
          <h2>Search results</h2>
          {status === 'idle' && (
            <EmptyState title="Find your first food">
              Search by food name, such as oats, to see serving sizes and nutrition.
            </EmptyState>
          )}
          {status === 'invalid' && (
            <ErrorState message="Use at most 100 search characters, then search again." />
          )}
          {status === 'loading' && <LoadingState message="Loading food results. Please wait." />}
          {status === 'error' && (
            <ErrorState
              message="Foods could not be loaded. Your search text is kept. Try again."
              onRetry={() => search(term)}
            />
          )}
          {status === 'success' &&
            (foods.length ? (
              <>
                <p role="status">
                  {foods.length} results for “{term}”. Up to 25 matches are shown.
                </p>
                <ul className="shared-preview-results">
                  {foods.map((food) => (
                    <li key={food.servingId}>
                      <FoodCard
                        {...food}
                        onSelect={
                          onSave
                            ? () => {
                                if (selected?.servingId !== food.servingId)
                                  setDraft({ amount: '1', meal: initialMeal });
                                setSelected(food);
                                setChoosing(true);
                              }
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState title={`No foods found for “${term}”`}>
                Try another food name or a shorter search.
              </EmptyState>
            ))}
        </section>
        <a className="design-action" href="#/app/dashboard">
          Back to diary
        </a>
      </div>
    </>
  );
}
