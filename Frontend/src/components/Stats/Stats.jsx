import { useState } from 'react';
import { usePersonal } from '../../hooks/usePersonal.js';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';
import WeightHistory from '../WeightHistory/WeightHistory.jsx';
import { localToday, shiftDay, effectiveGoal, goalOutcome } from '../../../../shared/personal.js';
import './Stats.css';

export default function Stats({ account, date, onSelectDate }) {
  const [month, setMonth] = useState(date.slice(0, 7));
  const first = `${month}-01`;
  const next = new Date(`${first}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = shiftDay(next.toISOString().slice(0, 10), -1);
  const state = usePersonal(`stats?from=${first}&to=${last}`);
  const today = localToday(account.timeZone);
  const heading = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${first}T12:00:00Z`));
  const days = state.data?.days ?? [],
    goals = state.data?.goals ?? [];
  const offset = new Date(`${first}T12:00:00Z`).getUTCDay();
  const length = Number(last.slice(-2));
  const cells = Array.from(
    { length: Math.ceil((offset + length) / 7) * 7 },
    (_, i) => i - offset + 1,
  );
  function move(n) {
    const m = new Date(`${first}T12:00:00Z`);
    m.setUTCMonth(m.getUTCMonth() + n);
    if (m.getUTCFullYear() > 0 && m.getUTCFullYear() < 10000) setMonth(m.toISOString().slice(0, 7));
  }
  return (
    <>
      <h1>Stats</h1>
      <section className="personal-panel" aria-label="Food logging calendar">
        <h2>Food logging calendar</h2>
        <div className="calendar-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous month">
            ‹
          </button>
          <h3 aria-live="polite">{heading}</h3>
          <button type="button" onClick={() => move(1)} aria-label="Next month">
            ›
          </button>
        </div>
        {state.loading ? (
          <LoadingState message="Loading calendar…" />
        ) : state.error ? (
          <ErrorState message="Calendar could not be loaded." onRetry={state.reload} />
        ) : (
          <>
            <table className="calendar">
              <caption>
                Based on logged foods · {account.timeZone}. Tab through dates; Enter opens a daily
                summary.
              </caption>
              <thead>
                <tr>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <th key={d} scope="col">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cells.length / 7 }, (_, week) => (
                  <tr key={week}>
                    {cells.slice(week * 7, week * 7 + 7).map((n, i) => {
                      if (n < 1 || n > length) return <td key={i} />;
                      const when = `${month}-${String(n).padStart(2, '0')}`,
                        day = days.find((d) => d.date === when);
                      const outcome =
                        when > today
                          ? { state: 'future', label: 'Future day' }
                          : goalOutcome(day?.calories, day?.count, effectiveGoal(goals, when));
                      return (
                        <td key={i}>
                          <button
                            type="button"
                            className={`calendar-day calendar-day--${outcome.state}${outcome.shade ? '-' + outcome.shade : ''}`}
                            aria-current={when === today ? 'date' : undefined}
                            aria-label={`${when}: ${outcome.label}`}
                            title={outcome.label}
                            onClick={() => onSelectDate(when)}
                          >
                            {n}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="calendar-legend" aria-label="Calendar legend">
              {['met', 'outside'].flatMap((status) =>
                ['light', 'regular', 'dark'].map((shade) => (
                  <span key={status + shade} className={`calendar-day--${status}-${shade}`}>
                    {status === 'met' ? 'Goal met' : 'Outside goal'} · {shade}
                  </span>
                )),
              )}
            </div>
            <p>
              Light: up to 50 kcal from target. Regular: more than 50 and up to 100. Dark: more than
              100. Green/red indicate your saved goal rule; intensity shows distance, not health. No
              food, no goal, unknown and future dates remain neutral.
            </p>
            <dl className="streak-totals">
              <div>
                <dt>Current logging streak</dt>
                <dd>{state.data.streaks.current} days</dd>
                {state.data.streaks.ending && <p>Through {state.data.streaks.ending}</p>}
              </div>
              <div>
                <dt>Longest goal-met streak</dt>
                <dd>{state.data.streaks.longest} days</dd>
              </div>
            </dl>
            <p>
              One saved food makes a logged day. An unlogged today does not end yesterday's logging
              streak until the next day. Gaps interrupt streak evidence; they are not labeled failed
              goals.
            </p>
          </>
        )}
      </section>
      <WeightHistory account={account} />
    </>
  );
}
