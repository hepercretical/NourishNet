import { useEffect, useRef, useState } from 'react';
import { accountRequest } from '../../services/accounts.js';
import AccountDiary from '../AccountDiary/AccountDiary.jsx';
import FoodSearch from '../FoodSearch/FoodSearch.jsx';
import { meals } from '../../utils/foodForm.js';

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
function initialDate(account) {
  try {
    const stored = sessionStorage.getItem(`nourishnet:diary-date:${account.id}`);
    if (validDate(stored)) return stored;
  } catch {
    /* Storage may be unavailable; the diary still works. */
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: account.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function AccountTracker({ account, route, onNotice }) {
  const [date, setDate] = useState(() => initialDate(account));
  const [dateError, setDateError] = useState(false);
  const saveController = useRef(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      saveController.current?.abort();
    };
  }, [route]);
  useEffect(() => {
    try {
      sessionStorage.setItem(`nourishnet:diary-date:${account.id}`, date);
    } catch {
      /* The diary remains usable without browser storage. */
    }
  }, [account.id, date]);
  function selectDate(event) {
    const value = event.target.value;
    setDateError(!validDate(value));
    if (!validDate(value)) return;
    setDate(value);
    onNotice('');
  }
  async function save(entry) {
    const controller = new AbortController();
    saveController.current = controller;
    await accountRequest('/diary', {
      signal: controller.signal,
      body: {
        date,
        servingId: entry.servingId,
        quantity: entry.amount,
        meal: entry.meal.toLowerCase(),
        requestKey: entry.id,
      },
    });
    if (!active.current || controller.signal.aborted)
      throw new DOMException('Cancelled', 'AbortError');
    onNotice(`Added ${entry.name} to ${entry.meal.toLowerCase()} for ${date}.`);
    window.location.hash = '/app/dashboard';
  }
  const searching = route.split('/')[2] === 'search';
  const meal = route.split('/')[3];
  return (
    <>
      {!searching && (
        <div className="shared-field">
          <label className="shared-field__label" htmlFor="diary-date">
            Diary date
          </label>
          <input
            className="shared-field__control"
            id="diary-date"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            required
            value={date}
            onChange={selectDate}
            aria-invalid={dateError || undefined}
            aria-describedby={dateError ? 'diary-date-hint diary-date-error' : 'diary-date-hint'}
          />
          <p id="diary-date-hint">Dates use your account time zone: {account.timeZone}.</p>
          {dateError && (
            <p className="shared-field__error" id="diary-date-error" role="alert">
              Choose a real diary date. The previous date is still selected.
            </p>
          )}
        </div>
      )}
      {searching ? (
        <>
          <p>
            Adding food for {date} · {account.timeZone}
          </p>
          <FoodSearch key={date} initialMeal={meals.includes(meal) ? meal : ''} onSave={save} />
        </>
      ) : (
        <AccountDiary key={date} account={account} date={date} />
      )}
    </>
  );
}
