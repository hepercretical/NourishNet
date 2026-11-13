// Pure shared calculations: no storage, credentials, network or inferred inputs.
export const formulaVersion = 'nourishnet-goals-internal-v1';
export const estimateNotice =
  'These suggestions are estimates calculated using mathematical formulas. They are not professional medical advice or a diagnosis. Your needs may differ. Consult a qualified healthcare professional for advice specific to you.';
export const macroKeys = ['protein', 'carbohydrates', 'fat'];
export const factors = { protein: 4, carbohydrates: 4, fat: 9 };
const coefficients = {
  male: {
    inactive: [753.07, -10.83, 6.5, 14.1],
    'low-active': [581.47, -10.83, 8.3, 14.94],
    active: [1004.82, -10.83, 6.52, 15.91],
    'very-active': [-517.88, -10.83, 15.61, 19.11],
  },
  female: {
    inactive: [584.9, -7.01, 5.72, 11.71],
    'low-active': [575.77, -7.01, 6.6, 12.14],
    active: [710.25, -7.01, 6.54, 12.34],
    'very-active': [511.83, -7.01, 9.07, 12.56],
  },
};
export function estimateEnergy({ sex, activity, age, height, weight, heightUnit, weightUnit }) {
  const row = coefficients[sex]?.[activity];
  if (
    !row ||
    !Number.isInteger(age) ||
    age < 19 ||
    ![height, weight].every((v) => Number.isFinite(v) && v > 0)
  )
    return null;
  if (!['cm', 'in'].includes(heightUnit) || !['kg', 'lb'].includes(weightUnit)) return null;
  const cm = height * (heightUnit === 'in' ? 2.54 : 1);
  const kg = weight * (weightUnit === 'lb' ? 0.45359237 : 1);
  const value = row[0] + row[1] * age + row[2] * cm + row[3] * kg;
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}
export function localToday(timeZone, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function shiftDay(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
// Decimal fixed-point at diary precision (8 places), not display-rounded floats.
function scaled(value) {
  const [whole, fraction = ''] = String(value).split('.');
  if (!/^\d+$/.test(whole) || !/^\d{0,8}$/.test(fraction)) return null;
  return BigInt(whole) * 100000000n + BigInt(fraction.padEnd(8, '0'));
}
export function goalOutcome(calories, count, goal) {
  if (!count) return { state: 'unlogged', label: 'No food logged' };
  if (calories == null) return { state: 'unknown', label: 'Calories not provided' };
  if (!goal) return { state: 'no-goal', label: 'No goal set' };
  const c = scaled(calories),
    t = scaled(goal.calories);
  if (
    c === null ||
    t === null ||
    t <= 0n ||
    !['deficit', 'surplus', 'maintain'].includes(goal.mode)
  )
    return { state: 'unknown', label: 'Comparison unavailable' };
  const delta = c - t,
    distance = delta < 0n ? -delta : delta;
  const met =
    goal.mode === 'deficit'
      ? delta <= 0n
      : goal.mode === 'surplus'
        ? delta >= 0n
        : distance <= 25000000000n;
  const shade = distance <= 5000000000n ? 'light' : distance <= 10000000000n ? 'regular' : 'dark';
  return {
    state: met ? 'met' : 'outside',
    shade,
    label: `${met ? 'Goal met' : 'Outside goal'} · ${Number(distance) / 1e8} kcal from target`,
  };
}
export function effectiveGoal(goals, date) {
  return goals.filter((g) => g.effectiveDate <= date).at(-1) ?? null;
}
export function streaks(days, goals, today) {
  let run = 0,
    longest = 0,
    previous;
  for (const day of days.filter((d) => d.date <= today)) {
    const result = goalOutcome(day.calories, day.count, effectiveGoal(goals, day.date));
    if (result.state === 'met') run = previous && shiftDay(previous, 1) === day.date ? run + 1 : 1;
    else run = 0;
    longest = Math.max(longest, run);
    previous = day.date;
  }
  const logged = new Set(days.filter((d) => d.count).map((d) => d.date));
  let end = logged.has(today) ? today : shiftDay(today, -1),
    current = 0;
  const ending = end;
  while (logged.has(end)) {
    current++;
    end = shiftDay(end, -1);
  }
  return { current, longest, ending: current ? ending : null };
}
export function macroEnergy(totals) {
  if (!macroKeys.every((k) => Number.isFinite(totals[k]) && totals[k] >= 0)) return null;
  const energy = macroKeys.map((k) => totals[k] * factors[k]);
  const total = energy.reduce((a, b) => a + b, 0);
  return macroKeys.map((key, i) => ({
    key,
    grams: totals[key],
    percent: total ? (energy[i] / total) * 100 : 0,
  }));
}
