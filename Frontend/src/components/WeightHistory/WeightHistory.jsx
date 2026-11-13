import { useState } from 'react';
import { usePersonal } from '../../hooks/usePersonal.js';
import { usePersonalMutation } from '../../hooks/usePersonalMutation.js';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';
import { localToday, shiftDay } from '../../../../shared/personal.js';
import './WeightHistory.css';

function intervalStart(today, months) {
  const date = new Date(`${today}T12:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const end = new Date(date);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  date.setUTCDate(Math.min(day, end.getUTCDate()));
  return date.toISOString().slice(0, 10);
}
export default function WeightHistory({ account }) {
  const today = localToday(account.timeZone);
  const [range, setRange] = useState({ from: intervalStart(today, 3), to: today });
  const [interval, setInterval] = useState('3months'),
    [unit, setUnit] = useState('kg');
  const [draft, setDraft] = useState({ date: today, weight: '', currentVersion: null });
  const [validation, setValidation] = useState(''),
    [remove, setRemove] = useState(false);
  const state = usePersonal(`weights?from=${range.from}&to=${range.to}`),
    mutation = usePersonalMutation('weights');
  const weights = state.data?.weights ?? [];
  const convert = (kg) => kg / (unit === 'lb' ? 0.45359237 : 1);
  function choose(value) {
    setInterval(value);
    let from,
      to = today;
    if (value === '7' || value === '30') from = shiftDay(today, 1 - Number(value));
    else if (value === 'month') from = today.slice(0, 7) + '-01';
    else if (value === 'previous') {
      to = shiftDay(today.slice(0, 7) + '-01', -1);
      from = to.slice(0, 7) + '-01';
    } else if (value === 'start') from = state.data?.earliest ?? today;
    else from = intervalStart(today, value === '6months' ? 6 : 3);
    setRange({ from, to });
  }
  function edit(row) {
    setDraft({ date: row.date, weight: convert(row.kg).toFixed(4), currentVersion: row.id });
    setRemove(false);
    setValidation('');
  }
  async function submit(e) {
    e.preventDefault();
    if (
      !/^\d+(?:\.\d{1,4})?$/.test(draft.weight) ||
      Number(draft.weight) <= 0 ||
      Number(draft.weight) >= 100000000 ||
      !draft.date ||
      draft.date > today ||
      (remove && !draft.currentVersion)
    ) {
      setValidation(
        'Choose a date up to today and a positive weight with at most four decimal places. Select an existing measurement before removing it.',
      );
      return;
    }
    setValidation('');
    await mutation.save({ ...draft, weight: Number(draft.weight), unit, removed: remove }, () => {
      state.reload();
      setDraft({ date: today, weight: '', currentVersion: null });
      setRemove(false);
    });
  }
  const first = weights[0],
    latest = weights.at(-1);
  const min = weights.length ? Math.min(...weights.map((w) => convert(w.kg))) : 0,
    max = weights.length ? Math.max(...weights.map((w) => convert(w.kg))) : 1;
  const start = first ? Date.parse(first.date) : 0,
    finish = latest ? Date.parse(latest.date) : 1;
  // SVG coordinates use a fixed drawing canvas; only saved observations become points.
  const points = weights.map((w) => ({
    row: w,
    x: 30 + (finish === start ? 210 : ((Date.parse(w.date) - start) / (finish - start)) * 420),
    y: 20 + (max === min ? 75 : ((max - convert(w.kg)) / (max - min)) * 150),
  }));
  return (
    <section className="personal-panel" aria-label="Weight history">
      <h2>Weight history</h2>
      <p>
        Private measurements you enter. Lines connect observations; missing dates are not weigh-ins.
      </p>
      <div className="shared-form">
        <label>
          Weight graph interval
          <select value={interval} onChange={(e) => choose(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="month">This month</option>
            <option value="previous">Previous month</option>
            <option value="3months">Last 3 months</option>
            <option value="6months">Last 6 months</option>
            <option value="start">Since starting weight</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        <label>
          From date
          <input
            type="date"
            value={range.from}
            max={range.to}
            onChange={(e) => {
              if (e.target.value) {
                setInterval('custom');
                setRange({ ...range, from: e.target.value });
              }
            }}
          />
        </label>
        <label>
          To date
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={today}
            onChange={(e) => {
              if (e.target.value) {
                setInterval('custom');
                setRange({ ...range, to: e.target.value });
              }
            }}
          />
        </label>
        <label>
          Weight display unit
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              setDraft({ ...draft, weight: '' });
            }}
          >
            <option value="kg">Kilograms</option>
            <option value="lb">Pounds</option>
          </select>
        </label>
      </div>
      {state.loading ? (
        <LoadingState message="Loading weight history…" />
      ) : state.error ? (
        <ErrorState
          message="Weight history could not be loaded. Use an interval of at most ten years."
          onRetry={state.reload}
        />
      ) : weights.length ? (
        <>
          <p>
            Start: {convert(first.kg).toFixed(2)} {unit} ({first.date}) · Latest:{' '}
            {convert(latest.kg).toFixed(2)} {unit} ({latest.date}) · Change:{' '}
            {(convert(latest.kg) - convert(first.kg)).toFixed(2)} {unit}
          </p>
          <svg
            className="weight-chart"
            viewBox="0 0 480 210"
            role="img"
            aria-label={`Recorded weights in ${unit}. See the measurements table for dates and exact values.`}
          >
            <title>Private recorded weight history</title>
            <path d="M30 10V180H460" className="weight-chart__axis" />
            <text x="0" y="15">
              {max.toFixed(1)}
            </text>
            <text x="0" y="175">
              {min.toFixed(1)}
            </text>
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              className="weight-chart__line"
            />
            {points.map((p) => (
              <circle key={p.row.id} cx={p.x} cy={p.y} r="4">
                <title>
                  {p.row.date}: {convert(p.row.kg).toFixed(4)} {unit}
                </title>
              </circle>
            ))}
            <text x="30" y="205">
              {first.date}
            </text>
            <text x="350" y="205">
              {latest.date}
            </text>
          </svg>
          {weights.length === 1 && (
            <p>One measurement recorded. Add another dated measurement to see change over time.</p>
          )}
          <table>
            <caption>Recorded weight measurements</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Weight ({unit})</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {weights.map((w) => (
                <tr key={w.id}>
                  <th scope="row">{w.date}</th>
                  <td>{convert(w.kg).toFixed(4)}</td>
                  <td>
                    <button
                      type="button"
                      disabled={mutation.pending}
                      onClick={() => edit(w)}
                      aria-label={`Edit weight for ${w.date}`}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>
          No weight measurements in this interval. Enter a dated measurement below to start your
          graph.
        </p>
      )}
      <form className="shared-form" onSubmit={submit} noValidate>
        <fieldset disabled={mutation.pending}>
          <legend>{draft.currentVersion ? 'Edit measurement' : 'Record weight'}</legend>
          <label>
            Measurement date
            <input
              type="date"
              max={today}
              value={draft.date}
              disabled={!!draft.currentVersion}
              onChange={(e) => {
                const found = weights.find((w) => w.date === e.target.value);
                if (found) edit(found);
                else setDraft({ date: e.target.value, weight: '', currentVersion: null });
                setRemove(false);
              }}
            />
          </label>
          <label>
            Weight ({unit})
            <input
              inputMode="decimal"
              value={draft.weight}
              onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
            />
          </label>
          {draft.currentVersion && (
            <label>
              <input
                type="checkbox"
                checked={remove}
                onChange={(e) => setRemove(e.target.checked)}
              />{' '}
              Remove this measurement from the graph (retain its history).
            </label>
          )}
        </fieldset>
        {(validation || mutation.error) && <p role="alert">{validation || mutation.error}</p>}
        {mutation.saved && <p role="status">Weight history updated.</p>}
        <button disabled={mutation.pending}>
          {mutation.pending ? 'Saving…' : remove ? 'Confirm removal' : 'Save weight'}
        </button>
        {draft.currentVersion && (
          <button
            type="button"
            disabled={mutation.pending}
            onClick={() => {
              setDraft({ date: today, weight: '', currentVersion: null });
              setRemove(false);
            }}
          >
            Cancel edit
          </button>
        )}
      </form>
    </section>
  );
}
