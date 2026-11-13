import { useEffect, useRef, useState } from 'react';
import { usePersonal } from '../../hooks/usePersonal.js';
import { accountRequest } from '../../services/accounts.js';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';
import {
  estimateEnergy,
  estimateNotice,
  formulaVersion,
  localToday,
  macroKeys,
  factors,
} from '../../../../shared/personal.js';

function GoalEditor({ goal, date, onSaved }) {
  const [calories, setCalories] = useState(goal?.calories?.toString() ?? '');
  const [mode, setMode] = useState(goal?.mode ?? 'maintain');
  const [macroMode, setMacroMode] = useState(goal?.macroMode ?? 'grams');
  const [macros, setMacros] = useState(
    Object.fromEntries(macroKeys.map((k) => [k, goal?.macros?.[k]?.toString() ?? ''])),
  );
  const [inputs, setInputs] = useState({
    sex: '',
    activity: '',
    age: '',
    height: '',
    weight: '',
    heightUnit: 'cm',
    weightUnit: 'kg',
  });
  const [eligible, setEligible] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [provenance, setProvenance] = useState({ kind: 'manual' });
  const [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false),
    attempt = useRef(null),
    controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const currentVersion = goal?.effectiveDate === date ? goal.id : null;
  const validAmount = (v) => /^\d+(?:\.\d{1,4})?$/.test(v) && Number(v) < 100000000;
  const complete = macroKeys.every((k) => macros[k] !== '' && validAmount(macros[k]));
  function calculate() {
    const normalized = {
      ...inputs,
      age: Number(inputs.age),
      height: Number(inputs.height),
      weight: Number(inputs.weight),
    };
    const baseline = eligible ? estimateEnergy(normalized) : null;
    if (baseline === null) {
      setError(
        'Choose all formula inputs and confirm its limits, or skip the calculator and enter your own target. This formula does not provide an estimate for every age or situation.',
      );
      return;
    }
    setEstimate({ baseline, inputs: normalized });
    setError('');
  }
  function change() {
    setReview(false);
    setError('');
    setConfirmed(false);
  }
  function convert(next = macroMode === 'grams' ? 'percent' : 'grams') {
    if (macroKeys.every((k) => macros[k] === '')) {
      setMacroMode(next);
      change();
      return;
    }
    if (!complete || !validAmount(calories) || Number(calories) <= 0) {
      setError('Enter a calorie target and all three macro values before converting.');
      return;
    }
    setMacros(
      Object.fromEntries(
        macroKeys.map((k) => [
          k,
          (next === 'percent'
            ? ((Number(macros[k]) * factors[k]) / Number(calories)) * 100
            : (Number(calories) * Number(macros[k])) / 100 / factors[k]
          ).toFixed(4),
        ]),
      ),
    );
    setMacroMode(next);
    change();
  }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const any = macroKeys.some((k) => macros[k] !== '');
    if (
      !validAmount(calories) ||
      Number(calories) <= 0 ||
      (any && !complete) ||
      (any &&
        macroMode === 'percent' &&
        macroKeys.reduce((s, k) => s + Math.round(Number(macros[k]) * 10000), 0) !== 1000000)
    ) {
      setError(
        'Enter a positive calorie target with at most four decimal places. Enter all three optional macros; percentages must total 100.',
      );
      return;
    }
    if (any && macroMode === 'percent' && macroKeys.some((k) => Number(macros[k]) > 100)) {
      setError('Each percentage must be between 0 and 100.');
      return;
    }
    if (!review) {
      setReview(true);
      setError('');
      return;
    }
    if (currentVersion && !confirmed) {
      setError(
        'Confirm replacement of the goal for this effective date. Older versions will be retained.',
      );
      return;
    }
    const value = {
      effectiveDate: date,
      calories: Number(calories),
      mode,
      macroMode,
      macros: any ? Object.fromEntries(macroKeys.map((k) => [k, Number(macros[k])])) : null,
      provenance,
      currentVersion,
    };
    const signature = JSON.stringify(value);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    lock.current = true;
    setPending(true);
    setError('');
    controller.current = new AbortController();
    try {
      await accountRequest('/personal/goals', {
        signal: controller.current.signal,
        body: { ...value, requestKey: attempt.current.key },
      });
      if (!controller.current.signal.aborted) {
        setReview(false);
        onSaved();
      }
    } catch {
      if (!controller.current.signal.aborted)
        setError(
          'Goal could not be saved. Your choices are kept. Retry, or reload if the date changed elsewhere.',
        );
    } finally {
      lock.current = false;
      if (!controller.current.signal.aborted) setPending(false);
    }
  }
  return (
    <>
      <details className="personal-panel">
        <summary>Calculate a reference calorie estimate</summary>
        <p>
          Biological sex selects formula coefficients; age, height, weight and habitual activity
          estimate daily energy. These categories are not gender identity. You can skip this
          calculator and set a manual target.
        </p>
        <p>
          This formula is for ages 19 and above. Do not use it for pregnancy/breastfeeding,
          eating-disorder contexts or circumstances needing individualized clinical nutrition. No
          diagnosis or condition details are collected.
        </p>
        <div className="shared-form">
          <label>
            Formula sex category
            <select
              value={inputs.sex}
              onChange={(e) => {
                setInputs({ ...inputs, sex: e.target.value });
                setEstimate(null);
                setProvenance({ kind: 'manual' });
                change();
              }}
            >
              <option value="">Choose a category</option>
              <option value="female">Female formula</option>
              <option value="male">Male formula</option>
              <option value="skip">Prefer not to use these categories</option>
            </select>
          </label>
          <label>
            Habitual activity
            <select
              value={inputs.activity}
              onChange={(e) => {
                setInputs({ ...inputs, activity: e.target.value });
                setEstimate(null);
                setProvenance({ kind: 'manual' });
                change();
              }}
            >
              <option value="">Choose activity</option>
              {['inactive', 'low-active', 'active', 'very-active'].map((a) => (
                <option key={a} value={a}>
                  {a.replaceAll('-', ' ')}
                </option>
              ))}
            </select>
          </label>
          <a
            href="https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html"
            target="_blank"
            rel="noreferrer"
          >
            Activity definitions and formula source
          </a>
          {['age', 'height', 'weight'].map((k) => (
            <label key={k}>
              {k === 'age'
                ? 'Age (completed years)'
                : k === 'height'
                  ? `Height (${inputs.heightUnit})`
                  : `Weight (${inputs.weightUnit})`}
              <input
                inputMode="decimal"
                value={inputs[k]}
                onChange={(e) => {
                  setInputs({ ...inputs, [k]: e.target.value });
                  setEstimate(null);
                  setProvenance({ kind: 'manual' });
                  change();
                }}
              />
            </label>
          ))}
          <label>
            Height unit
            <select
              value={inputs.heightUnit}
              onChange={(e) => {
                setInputs({ ...inputs, height: '', heightUnit: e.target.value });
                setEstimate(null);
              }}
            >
              <option value="cm">Centimeters</option>
              <option value="in">Total inches</option>
            </select>
          </label>
          <label>
            Weight unit
            <select
              value={inputs.weightUnit}
              onChange={(e) => {
                setInputs({ ...inputs, weight: '', weightUnit: e.target.value });
                setEstimate(null);
              }}
            >
              <option value="kg">Kilograms</option>
              <option value="lb">Pounds</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={eligible}
              onChange={(e) => {
                setEligible(e.target.checked);
                setEstimate(null);
              }}
            />{' '}
            I have read the formula limits and choose to use this reference estimate.
          </label>
          <button type="button" onClick={calculate}>
            Calculate estimate
          </button>
        </div>
        {estimate && (
          <section aria-label="Reference estimate">
            <h2>{estimate.baseline} kcal/day reference estimate</h2>
            <p>{estimateNotice}</p>
            <p>
              Maintain: reference only. Deficit, surplus and muscle gain: no automatic adjustment or
              promised weight-change rate. Enter your chosen target below.
            </p>
            <button
              type="button"
              onClick={() => {
                setCalories(String(estimate.baseline));
                setProvenance({ kind: 'estimate', version: formulaVersion, ...estimate });
                change();
              }}
            >
              Use this reference as my draft target
            </button>
          </section>
        )}
        <p>
          Health Canada EER, version {formulaVersion}. Each activity row already includes habitual
          activity; no exercise multiplier is added. Inputs convert inches × 2.54 to cm and pounds ×
          0.45359237 to kg. Estimates round to whole kcal; they do not establish a medically safe
          target.
        </p>
      </details>
      <form className="shared-form personal-panel" onSubmit={submit} noValidate>
        <h2>My calorie and macro goals</h2>
        <p>Effective {date}. Saving creates a version; older dates retain their own targets.</p>
        <fieldset disabled={pending}>
          <legend>Personal targets</legend>
          <label>
            Calorie target (kcal/day)
            <input
              inputMode="decimal"
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                setProvenance({ kind: 'manual' });
                change();
              }}
            />
          </label>
          <label>
            Calorie goal mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                change();
              }}
            >
              <option value="maintain">Maintain (within 250 kcal)</option>
              <option value="deficit">Deficit (at or below target)</option>
              <option value="surplus">Surplus (at or above target)</option>
            </select>
          </label>
          <p>
            Muscle gain can use your deliberately chosen surplus or maintain target. These labels
            describe recorded intake against a target, not clinical outcomes.
          </p>
          <label>
            Macro goal units
            <select value={macroMode} onChange={(e) => convert(e.target.value)}>
              <option value="grams">Grams per day</option>
              <option value="percent">Percentage of calorie target</option>
            </select>
          </label>
          <p>
            Macro goals are optional personal choices, not calculated recommendations. Enter all
            three or leave all blank. Percent goals must total 100.
          </p>
          {macroKeys.map((k) => (
            <label key={k}>
              {k[0].toUpperCase() + k.slice(1)} goal ({macroMode === 'percent' ? '%' : 'g'})
              <input
                inputMode="decimal"
                value={macros[k]}
                onChange={(e) => {
                  setMacros({ ...macros, [k]: e.target.value });
                  change();
                }}
              />
            </label>
          ))}
          <button type="button" onClick={() => convert()}>
            Convert current macro values to {macroMode === 'grams' ? 'percentages' : 'grams'}
          </button>
          <p>
            Conversion uses this calorie target and 4/4/9 kcal per gram for
            protein/carbohydrate/fat. Converted values are a draft to review, never saved
            automatically; rounding may require a percentage adjustment to total 100.
          </p>
        </fieldset>
        {review && (
          <section aria-label="Review goal">
            <h2>Review before saving</h2>
            <p>
              {calories} kcal/day · {mode} · {macroMode} · starts {date}
            </p>
            <p>{estimateNotice}</p>
            {currentVersion && (
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={pending}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />{' '}
                Replace the goal for this date and retain its earlier version.
              </label>
            )}
          </section>
        )}
        {error && <p role="alert">{error}</p>}
        <button disabled={pending} type="submit">
          {pending ? 'Saving goal…' : review ? 'Save reviewed goal' : 'Review goal'}
        </button>
      </form>
    </>
  );
}
export default function GoalSettings({ account }) {
  const today = localToday(account.timeZone);
  const [date, setDate] = useState(today),
    [saved, setSaved] = useState(false);
  const state = usePersonal(`goals?date=${encodeURIComponent(date)}`);
  return (
    <>
      <h1>Daily calorie preferences</h1>
      <a href="#/app/settings">Back to Preferences</a>
      <label className="shared-field">
        Goal effective date
        <input
          type="date"
          className="shared-field__control"
          min={today}
          value={date}
          onChange={(e) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
              setDate(e.target.value);
              setSaved(false);
            }
          }}
        />
      </label>
      {saved && <p role="status">Goal saved. Your diary and Stats use its effective date.</p>}
      {state.loading ? (
        <LoadingState message="Loading saved goal…" />
      ) : state.error ? (
        <ErrorState message="Goals could not be loaded." onRetry={state.reload} />
      ) : (
        <GoalEditor
          key={`${date}:${state.data.goal?.id ?? 'new'}`}
          goal={state.data.goal}
          date={date}
          onSaved={() => {
            setSaved(true);
            state.reload();
          }}
        />
      )}
    </>
  );
}
