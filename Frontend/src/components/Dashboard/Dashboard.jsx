import NutritionFacts from '../NutritionFacts/NutritionFacts.jsx';
import FoodCard from '../FoodCard/FoodCard.jsx';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';
import './Dashboard.css';
import { displayNutrition } from '../../utils/nutrition.js';
import DiaryEntryActions from '../DiaryEntryActions/DiaryEntryActions.jsx';

export default function Dashboard({
  account,
  diary,
  loading = false,
  error,
  onRetry,
  onEntryChange,
}) {
  return (
    <>
      <h1 className="dashboard__title" tabIndex={-1}>
        Your daily diary
      </h1>
      <p>{account.displayName} · Your diary is private. Sharing is off.</p>
      {loading ? (
        <LoadingState message="Loading your diary. Previous account data stays hidden." />
      ) : error ? (
        <ErrorState message="Your diary could not be loaded. Try again." onRetry={onRetry} />
      ) : (
        diary && (
          <>
            <section
              className="dashboard-summary"
              id="daily-summary"
              tabIndex={-1}
              aria-label="Recorded daily nutrition"
            >
              <h2>Recorded nutrition</h2>
              <p>
                {diary.date} · {diary.timeZone} · No goal · Day incomplete
              </p>
              <NutritionFacts values={displayNutrition(diary.totals)} />
              <p>
                These are recorded amounts, not recommendations. Nutrition reflects logged serving
                amounts.
              </p>
            </section>
            <div className="dashboard-meals">
              {diary.meals.map((meal) => (
                <section
                  className="dashboard-meal"
                  key={meal.name[0].toUpperCase() + meal.name.slice(1)}
                  aria-label={meal.name[0].toUpperCase() + meal.name.slice(1)}
                >
                  <div className="dashboard-meal__header">
                    <h2>{meal.name[0].toUpperCase() + meal.name.slice(1)}</h2>
                    <a
                      className="dashboard-meal__add"
                      aria-label={`Add food to ${meal.name.toLowerCase()}`}
                      href={`#/app/search/${meal.name[0].toUpperCase() + meal.name.slice(1)}`}
                    >
                      <span aria-hidden="true">＋</span>
                    </a>
                    {meal.totals && (
                      <span className="dashboard-meal__total">
                        {meal.totals.calories == null
                          ? 'Not provided'
                          : `${displayNutrition(meal.totals).calories} kcal`}
                      </span>
                    )}
                  </div>
                  {meal.entries.length ? (
                    <ul className="dashboard-entries">
                      {meal.entries.map((entry) => (
                        <li key={entry.id}>
                          <FoodCard
                            name={entry.foodName || entry.name}
                            servingLabel={entry.quantity == null ? 'Per serving' : 'Logged amount'}
                            servingBasis={
                              entry.quantity == null
                                ? entry.servingBasis
                                : `${entry.quantity} servings × ${entry.servingBasis}`
                            }
                            nutrients={displayNutrition(entry.contribution || entry.nutrients)}
                          />
                          {onEntryChange && (
                            <DiaryEntryActions
                              entry={{ ...entry, meal: meal.name.toLowerCase() }}
                              onChange={onEntryChange}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No food recorded for {meal.name.toLowerCase()}. Find a food when you are ready
                      to start this meal.
                    </p>
                  )}
                </section>
              ))}
            </div>
            <button
              type="button"
              className="dashboard-summary-link"
              onClick={() => {
                const summary = document.getElementById('daily-summary');
                summary?.focus();
                summary?.scrollIntoView?.();
              }}
            >
              View daily summary
            </button>
            <p>
              Search and confirm a food to save it to this diary date. Saved entries reload when you
              return or refresh.
            </p>
          </>
        )
      )}
    </>
  );
}
