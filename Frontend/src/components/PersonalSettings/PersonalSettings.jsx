import { useState } from 'react';
import { usePersonal } from '../../hooks/usePersonal.js';
import { usePersonalMutation } from '../../hooks/usePersonalMutation.js';
import { LoadingState, ErrorState } from '../DataState/DataState.jsx';

function AppearanceEditor({ data, onReload }) {
  const [mode, setMode] = useState(data.mode),
    [accent, setAccent] = useState(data.accent);
  const mutation = usePersonalMutation('appearance', 'PUT');
  return (
    <form
      className="shared-form personal-panel"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.save({ mode, accent, revision: data.revision }, (saved) => {
          window.dispatchEvent(new CustomEvent('nourishnet:appearance', { detail: saved }));
          onReload();
        });
      }}
    >
      <fieldset disabled={mutation.pending}>
        <legend>Saved appearance</legend>
        <label>
          Theme
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Main color
          <select value={accent} onChange={(e) => setAccent(e.target.value)}>
            {['green', 'blue', 'purple', 'red'].map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <p>
        Calendar outcome colors keep their meaning in every theme. Your choice is saved privately to
        your account.
      </p>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      <button disabled={mutation.pending}>
        {mutation.pending ? 'Saving…' : 'Save appearance'}
      </button>
    </form>
  );
}
function Appearance() {
  const state = usePersonal('appearance');
  const [saved, setSaved] = useState(false);
  return (
    <>
      <h1>Appearance</h1>
      {saved && <p role="status">Appearance saved.</p>}
      {state.loading ? (
        <LoadingState message="Loading appearance…" />
      ) : state.error ? (
        <ErrorState message="Appearance could not be loaded." onRetry={state.reload} />
      ) : (
        <AppearanceEditor
          key={state.data.revision}
          data={state.data}
          onReload={() => {
            setSaved(true);
            state.reload();
          }}
        />
      )}
    </>
  );
}
function Profile({ account }) {
  const [displayName, setName] = useState(account.displayName),
    [timeZone, setZone] = useState(account.timeZone),
    [validation, setValidation] = useState('');
  const mutation = usePersonalMutation('profile', 'PATCH');
  function submit(e) {
    e.preventDefault();
    try {
      if (!displayName.trim() || displayName.length > 100) throw new Error();
      new Intl.DateTimeFormat('en', { timeZone });
    } catch {
      setValidation('Enter a display name and a valid time zone, for example America/Denver.');
      return;
    }
    setValidation('');
    mutation.save(
      {
        displayName,
        timeZone,
        previousName: account.displayName,
        previousTimeZone: account.timeZone,
      },
      () => window.dispatchEvent(new Event('nourishnet:profile-changed')),
    );
  }
  return (
    <>
      <h1>My profile</h1>
      <form onSubmit={submit} className="shared-form personal-panel" noValidate>
        <fieldset disabled={mutation.pending}>
          <legend>Account profile</legend>
          <label>
            Display name
            <input value={displayName} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Diary time zone
            <input value={timeZone} onChange={(e) => setZone(e.target.value)} />
          </label>
        </fieldset>
        <p>Existing diary days keep their saved time zone. New days use this choice.</p>
        {(validation || mutation.error) && <p role="alert">{validation || mutation.error}</p>}
        {mutation.saved && <p role="status">Profile saved.</p>}
        <button disabled={mutation.pending}>{mutation.pending ? 'Saving…' : 'Save profile'}</button>
      </form>
    </>
  );
}
function Password() {
  const [currentPassword, setCurrent] = useState(''),
    [newPassword, setNew] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [validation, setValidation] = useState('');
  const mutation = usePersonalMutation('password');
  return (
    <>
      <h1>Change password</h1>
      <form
        className="shared-form personal-panel"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !currentPassword ||
            newPassword.length < 15 ||
            newPassword.length > 128 ||
            newPassword !== confirmation ||
            newPassword === currentPassword
          ) {
            setValidation(
              'Use a different password with 15 to 128 characters and a matching confirmation.',
            );
            return;
          }
          setValidation('');
          mutation.save({ currentPassword, newPassword }, () => {
            setCurrent('');
            setNew('');
            setConfirmation('');
            window.dispatchEvent(
              new CustomEvent('nourishnet:expired', {
                detail: { message: 'Password changed. Sign in with your new password.' },
              }),
            );
          });
        }}
      >
        <fieldset disabled={mutation.pending}>
          <legend>Replace your account password</legend>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
        </fieldset>
        <p>
          Changing your password signs out all account sessions. Use test-only passwords during
          private testing.
        </p>
        {(validation || mutation.error) && <p role="alert">{validation || mutation.error}</p>}
        <button disabled={mutation.pending}>
          {mutation.pending ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </>
  );
}
function Notifications() {
  const state = usePersonal('notifications');
  return (
    <>
      <h1>Notifications</h1>
      <p>Your product submission activity. No external notifications are sent.</p>
      {state.loading ? (
        <LoadingState message="Loading submission activity…" />
      ) : state.error ? (
        <ErrorState message="Activity could not be loaded." onRetry={state.reload} />
      ) : state.data.submissions?.length ? (
        <ul className="personal-menu">
          {state.data.submissions.map((s) => (
            <li key={s.id}>
              <a href={`#/app/submissions/${s.id}`}>
                {s.productName || `Barcode ${s.barcode}`} · {s.status}
              </a>
              <time dateTime={s.createdAt}>{new Date(s.createdAt).toLocaleDateString()}</time>
              {s.reviewNote && <p>{s.reviewNote}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          No submission activity yet.{' '}
          <a href="#/app/track">Track food or submit an unknown product</a> to get started.
        </p>
      )}
    </>
  );
}
export default function PersonalSettings({ page, account }) {
  return (
    <>
      <a className="design-action" href="#/app/settings">
        Back to Preferences
      </a>
      {page === 'appearance' ? (
        <Appearance />
      ) : page === 'profile' ? (
        <Profile account={account} />
      ) : page === 'password' ? (
        <Password />
      ) : (
        <Notifications />
      )}
    </>
  );
}
