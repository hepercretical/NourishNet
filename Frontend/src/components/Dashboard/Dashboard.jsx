import NutritionFacts from '../NutritionFacts/NutritionFacts.jsx';
import FoodCard from '../FoodCard/FoodCard.jsx';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';
import './Dashboard.css';
import { displayNutrition } from '../../utils/nutrition.js';

export default function Dashboard({
  account,
  diary,
  loading = false,
  error,
  onRetry,
  sessionEntries = [],
}) {
  return (
    <>
      <h1>Your daily diary</h1>
      <p>{account.displayName} · Your diary is private. Sharing is off.</p>
      {loading ? (
        <LoadingState message="Loading your diary. Previous account data stays hidden." />
      ) : error ? (
        <ErrorState message="Your diary could not be loaded. Try again." onRetry={onRetry} />
      ) : (
        diary && (
          <>
            <section className="dashboard-summary" aria-label="Recorded daily nutrition">
              <h2>Recorded nutrition</h2>
              <p>
                {diary.date} · {diary.timeZone} · No goal · Day incomplete
              </p>
              <NutritionFacts values={diary.totals} />
              <p>
                These are recorded amounts, not recommendations. Session entries below are not yet
                included in this summary. Database saving and daily totals arrive in a later update.
              </p>
            </section>
            <div className="dashboard-meals">
              {diary.meals.map((meal) => (
                <section className="dashboard-meal" key={meal.name} aria-label={meal.name}>
                  <h2>{meal.name}</h2>
                  {meal.entries.length ? (
                    <ul className="dashboard-entries">
                      {meal.entries.map((entry) => (
                        <li key={entry.id}>
                          <FoodCard {...entry} />
                        </li>
                      ))}
                    </ul>
                  ) : !sessionEntries.some((entry) => entry.meal === meal.name) ? (
                    <p>
                      No food recorded for {meal.name.toLowerCase()}. Find a food when you are ready
                      to start this meal.
                    </p>
                  ) : null}
                  {sessionEntries.some((entry) => entry.meal === meal.name) && (
                    <>
                      <p>Added for this app session only</p>
                      <ul className="dashboard-entries">
                        {sessionEntries
                          .filter((entry) => entry.meal === meal.name)
                          .map((entry) => (
                            <li key={entry.id}>
                              <FoodCard
                                {...entry}
                                servingLabel="Logged amount"
                                servingBasis={`${entry.amount} servings × ${entry.servingBasis}`}
                                nutrients={displayNutrition(entry.nutrients)}
                              />
                            </li>
                          ))}
                      </ul>
                    </>
                  )}
                  <a className="design-action" href={`#/app/search/${meal.name}`}>
                    Add food to {meal.name.toLowerCase()}
                  </a>
                </section>
              ))}
            </div>
            <p>
              Search and confirm a food to add it to a meal. Session entries clear on refresh or
              sign out and are not saved to the database yet.
            </p>
          </>
        )
      )}
    </>
  );
}
