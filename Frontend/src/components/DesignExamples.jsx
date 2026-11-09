import { useState } from 'react';
import { estimateNotice } from '../design/screens.js';

export function FoodExample() {
  return (
    <section className="design-panel" aria-label="Synthetic food example">
      <h2>Sample rolled oats</h2>
      <p>Serving basis: 40 g dry · Fictional catalog example</p>
      <p>
        Per serving: Calories 150 kcal · Protein 5 g · Fat 3 g · Carbohydrates 27 g · Sodium: Not
        provided
      </p>
      <p>
        For 1.5 servings (60 g): Calories 225 kcal · Protein 7.5 g · Fat 4.5 g · Carbohydrates 40.5
        g · Sodium: Not provided
      </p>
    </section>
  );
}

export function DiaryExample() {
  return (
    <>
      <section className="design-panel" aria-labelledby="daily-summary">
        <h2 id="daily-summary">November 9, 2026 · America/Denver</h2>
        <p>Recorded example totals · Day incomplete · No goal</p>
        <dl className="design-summary">
          {[
            ['Calories', '225 kcal'],
            ['Protein', '7.5 g'],
            ['Fat', '4.5 g'],
            ['Carbohydrates', '40.5 g'],
            ['Sodium', 'Not provided'],
          ].map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="design-meals">
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
          <section className="design-panel" key={meal}>
            <h2>{meal}</h2>
            {meal === 'Breakfast' ? (
              <>
                <p>Sample rolled oats with a deliberately long package description · 1.5 × 40 g</p>
                <p>
                  225 kcal · Protein 7.5 g · Fat 4.5 g · Carbohydrates 40.5 g · Sodium: Not provided
                </p>
                <a href="#/diary/edit">Edit breakfast entry</a>
              </>
            ) : (
              <p>No food recorded. Add a food when you are ready to log {meal.toLowerCase()}.</p>
            )}
            <a className="design-action" href="#/search">
              Add food to {meal.toLowerCase()}
            </a>
          </section>
        ))}
      </div>
    </>
  );
}

export function UploadExample() {
  return (
    <section className="design-panel" aria-label="Sample photo layout">
      <h2>Package photos</h2>
      <p>
        Image type and size limits will be approved with storage in Plan-17. No file is selected or
        uploaded here.
      </p>
      <div className="design-fields">
        {['Package front', 'Nutrition label'].map((name) => (
          <div key={name}>
            <p>
              <strong>{name}</strong>
            </p>
            <div className="design-image-placeholder">Sample image preview location</div>
            <p>Required photo · File feedback appears beside this preview.</p>
            <button type="button" disabled>
              Choose {name.toLowerCase()}
            </button>{' '}
            <button type="button" disabled>
              Replace {name.toLowerCase()}
            </button>{' '}
            <button type="button" disabled>
              Remove {name.toLowerCase()}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EstimateExample() {
  return (
    <section className="design-panel" aria-labelledby="estimate-heading">
      <h2 id="estimate-heading">Estimate awaiting approved formula</h2>
      <p>Calories: Not calculated · Macronutrient targets: Not calculated</p>
      <p>{estimateNotice}</p>
      <p>
        Formula/version, activity assumptions, supported populations, limits, and outcome rules:
        pending Plan-13 human and qualified review. Saving is unavailable.
      </p>
    </section>
  );
}

export function SharingExample() {
  return (
    <fieldset className="design-panel" disabled>
      <legend>Progress visible to Morgan (fictional)</legend>
      <p>Choose fields deliberately after connection acceptance. No choice is preselected.</p>
      <label className="design-choice">
        <input type="checkbox" /> Share selected daily goal progress (selection rules pending
        approval)
      </label>
      <p>No body measurements, biological sex, age, or detailed food logs.</p>
    </fieldset>
  );
}

const dayStates = ['No data', 'Incomplete', 'No goal', 'Not shared', 'Unavailable'];

export function CalendarExample({ comparison }) {
  const [month, setMonth] = useState(11);
  const [day, setDay] = useState('9');
  const monthName = month === 11 ? 'November' : 'December';
  const state = dayStates[(Number(day) - 1) % dayStates.length];
  return (
    <section className="design-panel" aria-labelledby="calendar-month">
      <h2 id="calendar-month">{monthName} 2026</h2>
      <p>
        Fictional dates · Your timezone: America/Denver
        {comparison ? ' · Morgan: America/New_York' : ''}
      </p>
      <div className="design-actions">
        <button
          type="button"
          onClick={() => {
            setMonth(11);
            setDay((current) => String(Math.min(Number(current), 30)));
          }}
          disabled={month === 11}
        >
          Previous month
        </button>
        <button type="button" onClick={() => setMonth(12)} disabled={month === 12}>
          Next month
        </button>
      </div>
      <p>
        Review example covers November and December. Use the day list with Tab and arrow keys. No
        custom calendar grid is required.
      </p>
      <label className="design-field">
        Day details
        <select value={day} onChange={(event) => setDay(event.target.value)}>
          {Array.from({ length: month === 11 ? 30 : 31 }, (_, index) => index + 1).map((date) => (
            <option value={date} key={date}>
              {monthName} {date} · {dayStates[(date - 1) % dayStates.length]}
            </option>
          ))}
        </select>
      </label>
      <p role="status">
        Selected: {monthName} {day}, 2026 · You: {state}
        {comparison ? ' · Morgan: Not shared' : ''}
      </p>
      <h3>Text legend</h3>
      <ul>
        <li>No data: nothing recorded for this date.</li>
        <li>Incomplete: some intake recorded; logging is not complete.</li>
        <li>No goal: no effective goal for this day.</li>
        <li>Not shared: selected progress is private.</li>
        <li>Unavailable: data cannot be displayed.</li>
        <li>Future day: progress is not yet available.</li>
      </ul>
      <p>
        None of these states means a failed goal. Goal outcome labels and day-completion actions
        await Plan-13 approval.
      </p>
    </section>
  );
}
