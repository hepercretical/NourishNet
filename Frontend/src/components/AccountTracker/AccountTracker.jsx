import { useEffect, useRef, useState } from 'react';
import { accountRequest } from '../../services/accounts.js';
import AccountDiary from '../AccountDiary/AccountDiary.jsx';
import FoodSearch from '../FoodSearch/FoodSearch.jsx';
import BarcodeScanner from '../BarcodeScanner/BarcodeScanner.jsx';
import ProductSubmission from '../ProductSubmission/ProductSubmission.jsx';
import Submissions from '../Submissions/Submissions.jsx';
import Preferences from '../Preferences/Preferences.jsx';
import { emptySubmission } from '../../utils/submissionDraft.js';
import { submitProduct } from '../../services/submissions.js';
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
  const [submission, setSubmission] = useState(emptySubmission);
  const submissionAttempt = useRef(null);
  const submissionController = useRef(null);
  const scanMeal = useRef('');
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      saveController.current?.abort();
      submissionController.current?.abort();
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
  function moveDay(offset) {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + offset);
    const value = next.toISOString().slice(0, 10);
    if (validDate(value)) selectDate({ target: { value } });
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
  const scanning = route.split('/')[2] === 'scan';
  const submitting = route.split('/')[2] === 'submissions';
  const meal = route.split('/')[3];
  function unknown(barcode) {
    scanMeal.current = meals.includes(meal) ? meal : '';
    if (submission.barcode !== barcode) setSubmission(emptySubmission(barcode));
    window.location.assign('#/app/submissions/new');
  }
  async function sendSubmission(value) {
    if (submissionAttempt.current?.draft !== value)
      submissionAttempt.current = { draft: value, key: crypto.randomUUID() };
    const controller = new AbortController();
    submissionController.current = controller;
    const result = await submitProduct(value, {
      requestKey: submissionAttempt.current.key,
      signal: controller.signal,
    });
    if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    return result;
  }
  if (route.split('/')[2] === 'settings') return <Preferences account={account} />;
  if (submitting) {
    if (meal === 'new')
      return (
        <ProductSubmission
          draft={submission}
          onDraftChange={setSubmission}
          onSubmit={sendSubmission}
          onBack={() => {
            window.location.hash = `/app/scan${scanMeal.current ? '/' + scanMeal.current : ''}`;
          }}
          onSubmitted={(result) => {
            setSubmission(emptySubmission());
            submissionAttempt.current = null;
            onNotice('Your photos were submitted for review. They are not catalog food yet.');
            window.location.hash = `/app/submissions/${result.id}`;
          }}
        />
      );
    return <Submissions key={meal || 'list'} id={meal} />;
  }
  return (
    <>
      {!searching && !scanning && (
        <div className="shared-field diary-datebar">
          <button
            type="button"
            aria-label="Previous diary day"
            disabled={date === '0001-01-01'}
            onClick={() => moveDay(-1)}
          >
            ‹
          </button>
          <div className="diary-datebar__selection">
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
          </div>
          <button
            type="button"
            aria-label="Next diary day"
            disabled={date === '9999-12-31'}
            onClick={() => moveDay(1)}
          >
            ›
          </button>
          <p id="diary-date-hint" className="diary-datebar__hint">
            Dates use your account time zone: {account.timeZone}.
          </p>
          {dateError && (
            <p className="shared-field__error" id="diary-date-error" role="alert">
              Choose a real diary date. The previous date is still selected.
            </p>
          )}
        </div>
      )}
      {searching || scanning ? (
        <>
          <p>
            Adding food for {date} · {account.timeZone}
          </p>
          {scanning ? (
            <BarcodeScanner
              key={date}
              initialMeal={meals.includes(meal) ? meal : ''}
              onSave={save}
              onUnknown={unknown}
            />
          ) : (
            <FoodSearch key={date} initialMeal={meals.includes(meal) ? meal : ''} onSave={save} />
          )}
        </>
      ) : (
        <AccountDiary key={date} account={account} date={date} />
      )}
    </>
  );
}
