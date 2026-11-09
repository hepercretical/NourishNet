import NutritionFacts from '../NutritionFacts/NutritionFacts.jsx';
import FoodCard from '../FoodCard/FoodCard.jsx';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';
import './Dashboard.css';

export default function Dashboard({ account, diary, loading = false, error, onRetry }) {
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
                These are recorded amounts, not recommendations. Logging and saved entries arrive in
                later plans.
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
                  ) : (
                    <p>
                      No food recorded for {meal.name.toLowerCase()}. Find a food when you are ready
                      to start this meal.
                    </p>
                  )}
                  <a className="design-action" href="#/app/search">
                    Add food to {meal.name.toLowerCase()}
                  </a>
                </section>
              ))}
            </div>
            <p>
              The add-food links open live food search. Meal saving arrives in a later plan; nothing
              is added yet.
            </p>
          </>
        )
      )}
    </>
  );
}
