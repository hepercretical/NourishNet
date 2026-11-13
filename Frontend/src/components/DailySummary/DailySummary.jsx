import { displayNutrition } from '../../utils/nutrition.js';
import { macroEnergy, macroKeys, factors, goalOutcome } from '../../../../shared/personal.js';
import './DailySummary.css';

const names = {
  protein: 'Protein',
  carbohydrates: 'Carbohydrates',
  fat: 'Fat',
  sodium: 'Sodium',
  calories: 'Calories',
};
export default function DailySummary({ diary }) {
  const values = Object.fromEntries(
    Object.keys(names).map((key) => [key, displayNutrition(diary.totals)[key] ?? 'Not provided']),
  );
  const outcome = goalOutcome(
    diary.totals.calories,
    (diary.meals ?? []).reduce((sum, meal) => sum + meal.entries.length, 0),
    diary.goal,
  );
  const portions = macroEnergy(diary.totals);
  const hasEnergy = portions?.some((p) => p.percent > 0);
  let angle = 0;
  const slices = hasEnergy
    ? portions
        .map((p) => {
          const start = angle;
          angle += p.percent * 3.6;
          return `var(--macro-${p.key}) ${start}deg ${angle}deg`;
        })
        .join(',')
    : undefined;
  return (
    <>
      <h1>Daily summary</h1>
      <p>
        {diary.date} · {diary.timeZone} · Based on logged foods
      </p>
      <p>
        {outcome.label}
        {diary.goal ? ` ? Saved ${diary.goal.mode} target: ${diary.goal.calories} kcal` : ''}
      </p>
      <section className="daily-label" aria-label="Daily nutrition facts">
        <h2>Nutrition totals</h2>
        <p>All recorded servings for this day</p>
        <dl>
          {['calories', 'fat', 'carbohydrates', 'protein', 'sodium'].map((k) => (
            <div key={k} className={k === 'calories' ? 'daily-label__calories' : ''}>
              <dt>{names[k]}</dt>
              <dd>
                {values[k]}
                {values[k] === 'Not provided'
                  ? ''
                  : k === 'calories'
                    ? ' kcal'
                    : k === 'sodium'
                      ? ' mg'
                      : ' g'}
              </dd>
            </div>
          ))}
        </dl>
        <p>Missing nutrients are not counted as zero. No percent Daily Values are inferred.</p>
      </section>
      <section className="personal-panel" aria-label="Source of calories">
        <h2>Source of calories</h2>
        {hasEnergy ? (
          <div
            className="macro-chart"
            role="img"
            aria-label="Macro calorie proportions. Exact values are in the table."
            style={{ background: `conic-gradient(${slices})` }}
          />
        ) : (
          <p>
            {portions
              ? 'No macro calories recorded yet. Log a food to see your chart.'
              : 'Some macro values are not provided. Complete percentages are unavailable.'}
          </p>
        )}
        <table>
          <caption>Recorded macros and saved goals</caption>
          <thead>
            <tr>
              <th scope="col">Macro</th>
              <th scope="col">Grams</th>
              <th scope="col">Calories %</th>
              <th scope="col">Goal</th>
            </tr>
          </thead>
          <tbody>
            {macroKeys.map((k) => {
              const portion = portions?.find((p) => p.key === k);
              const goal = diary.goal?.macros?.[k];
              const grams =
                goal == null
                  ? null
                  : diary.goal.macroMode === 'grams'
                    ? goal
                    : (diary.goal.calories * goal) / 100 / factors[k];
              return (
                <tr key={k}>
                  <th scope="row">
                    <span className={`macro-key macro-key--${k}`} aria-hidden="true" />
                    {names[k]}
                  </th>
                  <td>
                    {values[k]}
                    {values[k] === 'Not provided' ? '' : ' g'}
                  </td>
                  <td>
                    {portion && hasEnergy ? `${portion.percent.toFixed(2)}%` : 'Not available'}
                  </td>
                  <td>
                    {goal == null
                      ? 'Not set'
                      : `${Number(goal.toFixed(2))}${diary.goal.macroMode === 'percent' ? '%' : ' g'}${diary.goal.macroMode === 'percent' ? ` (${grams.toFixed(2)} g)` : ''}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>
          Macro energy uses 4 kcal/g protein, 4 kcal/g carbohydrate and 9 kcal/g fat. Percentages
          divide by their combined energy; separate alcohol and fiber factors are not included.
          Label calorie totals may differ. Display values are rounded.
        </p>
        <a href="#/app/settings/goals">Set calorie and macro goals</a>
      </section>
      <a className="design-action" href="#/app/dashboard">
        Back to this diary day
      </a>
    </>
  );
}
