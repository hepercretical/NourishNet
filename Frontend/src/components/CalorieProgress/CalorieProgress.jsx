export default function CalorieProgress({ calories, goal }) {
  if (!goal || !Number.isFinite(goal.calories) || goal.calories <= 0)
    return (
      <p>
        No goal set. <a href="#/app/settings/goals">Set a calorie target</a>
      </p>
    );
  if (!Number.isFinite(calories))
    return <p>Calorie progress is unavailable because some calories are not provided.</p>;
  const remaining = goal.calories - calories;
  return (
    <div className="calorie-progress">
      <div className="calorie-progress__values">
        <span>{Number(calories.toFixed(2))} kcal recorded</span>
        <span>
          {Number(Math.abs(remaining).toFixed(2))} kcal{' '}
          {remaining >= 0 ? 'remaining to target' : 'over target'}
        </span>
      </div>
      <progress
        max={goal.calories}
        value={Math.min(calories, goal.calories)}
        aria-label="Calorie intake towards saved target"
        aria-valuetext={`${calories} of ${goal.calories} kcal recorded; ${Math.abs(remaining)} kcal ${remaining >= 0 ? 'remaining to target' : 'over target'}`}
      />
      <p>
        Saved target: {goal.calories} kcal · {goal.mode}. Based on logged foods; the bar is not a
        health score.
      </p>
    </div>
  );
}
