import { scaleNutrition } from '../utils/nutrition.js';

const storageKey = 'nourishnet:synthetic-demo:v1';
const nutrientKeys = ['calories', 'protein', 'fat', 'carbohydrates', 'sodium'];
const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
export const demoAccount = {
  id: 'local-demo',
  displayName: 'Sample diary',
  timeZone: 'America/Denver',
};
export const demoFoods = [
  {
    id: 'oats',
    servingId: 'demo-oats',
    name: 'Sample rolled oats',
    servingBasis: '40 g dry oats',
    nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: 0 },
  },
  {
    id: 'bowl',
    servingId: 'demo-bowl',
    name: 'Sample lentil and roasted vegetable bowl with herb dressing',
    servingBasis: '1 bowl (300 g)',
    nutrients: { calories: 320, protein: 18, fat: 8, carbohydrates: 44, sodium: 480 },
  },
  {
    id: 'yogurt',
    servingId: 'demo-yogurt',
    name: 'Sample plain yogurt',
    servingBasis: '170 g cup',
    nutrients: { calories: 100, protein: 17, fat: 0, carbohydrates: 6, sodium: null },
  },
];

// Only Vite development can enter this synthetic adapter. API ownership stays intact.
export function isLocalDemo() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === '1';
}
function aggregate(entries) {
  return Object.fromEntries(
    nutrientKeys.map((key) => [
      key,
      entries.some((entry) => entry.contribution[key] == null)
        ? null
        : entries.reduce((total, entry) => total + entry.contribution[key], 0),
    ]),
  );
}
export async function demoRequest(path, { body, signal, method } = {}) {
  signal?.throwIfAborted();
  const url = new URL(path, 'http://demo.invalid');
  const state = JSON.parse(localStorage.getItem(storageKey) || '{"entries":[],"requests":{}}');
  if (url.pathname === '/foods') {
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();
    return {
      foods: query
        ? demoFoods.filter((food) => food.name.toLowerCase().includes(query)).slice(0, 25)
        : [],
    };
  }
  if (url.pathname === '/diary' && !body) {
    const date = url.searchParams.get('date');
    const entries = state.entries.filter((entry) => entry.date === date);
    return {
      date,
      timeZone: demoAccount.timeZone,
      totals: aggregate(entries),
      meals: meals.map((name) => {
        const selected = entries.filter((entry) => entry.meal === name);
        return { name, entries: selected, totals: aggregate(selected) };
      }),
    };
  }
  const signature = JSON.stringify([path, method, body]);
  const prior = state.requests[body?.requestKey];
  if (prior) {
    if (prior.signature !== signature) throw new Error('Use a new request for changed choices.');
    return prior.result;
  }
  let entry;
  if (url.pathname === '/diary' && body) {
    const food = demoFoods.find((item) => item.servingId === body.servingId);
    if (!food || !meals.includes(body.meal)) throw new Error('Choose a food and meal.');
    entry = {
      id: crypto.randomUUID(),
      revision: 1,
      date: body.date,
      foodName: food.name,
      servingBasis: food.servingBasis,
      nutrients: { ...food.nutrients },
      quantity: body.quantity,
      meal: body.meal,
      contribution: scaleNutrition(food.nutrients, body.quantity),
    };
    state.entries.push(entry);
  } else if (url.pathname.startsWith('/diary/entries/')) {
    entry = state.entries.find(
      (item) => item.id === url.pathname.split('/').at(-1) && item.date === body.date,
    );
    if (!entry || entry.revision !== body.revision) {
      const error = new Error('Reload this diary before making another change.');
      error.status = 409;
      throw error;
    }
    if (method === 'DELETE') state.entries = state.entries.filter((item) => item.id !== entry.id);
    else if (method === 'PATCH' && meals.includes(body.meal)) {
      entry.contribution = scaleNutrition(entry.nutrients, body.quantity);
      Object.assign(entry, {
        quantity: body.quantity,
        meal: body.meal,
        revision: entry.revision + 1,
      });
    } else throw new Error('Choose a supported diary action.');
  } else throw new Error('This feature is not available in the local demo.');
  const result = { date: body.date, entry };
  state.requests[body.requestKey] = { signature, result: structuredClone(result) };
  signal?.throwIfAborted();
  localStorage.setItem(storageKey, JSON.stringify(state));
  return result;
}
