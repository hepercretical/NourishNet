import { useRef, useState } from 'react';
import FormField from '../FormField/FormField.jsx';
import Button from '../Button/Button.jsx';
import './AccountForm.css';

const labels = {
  signup: 'Create fictional account',
  login: 'Sign in',
  verify: 'Verify account',
  recover: 'Request recovery code',
  reset: 'Reset password',
  profile: 'Complete account setup',
};

export default function AccountForm({
  mode,
  initialEmail = '',
  onSubmit,
  onResend,
  onGuest,
  hosted = false,
}) {
  const [draft, setDraft] = useState({
    email: initialEmail,
    password: '',
    displayName: '',
    timeZone: 'America/Denver',
    adult: false,
    code: '',
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const form = useRef(null);
  function change(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  async function run(action) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setFailure('');
    setMessage('');
    try {
      const result = await action();
      if (result?.message) setMessage(result.message);
    } catch (error) {
      setFailure(error.message);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    const next = {};
    if (
      mode !== 'profile' &&
      !(hosted ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/ : /^[^\s@]+@[^\s@]+\.(test|invalid)$/).test(
        draft.email.trim().toLowerCase(),
      )
    )
      next.email = hosted
        ? 'Enter your approved test email address.'
        : 'Use a fictional email ending in .test or .invalid.';
    if (
      ['login', 'signup', 'reset'].includes(mode) &&
      (draft.password.length < 15 || draft.password.length > 128)
    )
      next.password = 'Use 15 to 128 characters.';
    if (
      ['verify', 'reset'].includes(mode) &&
      !(hosted ? /^\d{6}$/ : /^[A-Za-z0-9_-]{43}$/).test(draft.code.trim())
    )
      next.code = hosted
        ? 'Enter the six-digit code from your test mailbox.'
        : 'Copy the complete code from the local outbox message.';
    if (['signup', 'profile'].includes(mode)) {
      if (!draft.displayName.trim() || draft.displayName.trim().length > 80)
        next.displayName = 'Enter a fictional display name with 1 to 80 characters.';
      if (!draft.adult) next.adult = 'NourishNet is for adults aged 18 and over.';
      try {
        new Intl.DateTimeFormat('en', { timeZone: draft.timeZone });
      } catch {
        next.timeZone = 'Enter a valid timezone, such as America/Denver.';
      }
    }
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    run(() =>
      onSubmit({ ...draft, code: draft.code.trim(), email: draft.email.trim().toLowerCase() }),
    );
  }
  const field = (name, label, type = 'text', hint) => (
    <FormField label={label} error={errors[name]} hint={hint}>
      {(props) => (
        <input
          {...props}
          name={name}
          type={type}
          value={draft[name]}
          onChange={(event) => change(name, event.target.value)}
          disabled={pending}
          autoComplete={
            name === 'password'
              ? mode === 'login'
                ? 'current-password'
                : 'new-password'
              : name === 'email'
                ? 'email'
                : 'off'
          }
        />
      )}
    </FormField>
  );
  return (
    <form ref={form} onSubmit={submit} noValidate aria-label={labels[mode]} aria-busy={pending}>
      {mode !== 'profile' &&
        field(
          'email',
          hosted ? 'Test email' : 'Fictional email',
          'email',
          hosted
            ? 'Use only an approved tester mailbox. Neon sends authentication emails.'
            : 'Use an address such as avery@example.test. No email is sent externally.',
        )}
      {['signup', 'profile'].includes(mode) && (
        <>
          {field('displayName', 'Fictional display name')}
          {field('timeZone', 'Timezone', 'text', 'For example, America/Denver.')}
          <FormField label="I am 18 or older" error={errors.adult}>
            {(props) => (
              <input
                {...props}
                type="checkbox"
                className={`${props.className} account-form__adult`}
                checked={draft.adult}
                onChange={(event) => change('adult', event.target.checked)}
                disabled={pending}
              />
            )}
          </FormField>
        </>
      )}
      {['verify', 'reset'].includes(mode) &&
        field(
          'code',
          'One-time code',
          'text',
          hosted
            ? 'Enter the six-digit code Neon sent to your test mailbox.'
            : 'Open the matching message in Backend/outbox. Codes expire after 30 minutes.',
        )}
      {['signup', 'login', 'reset'].includes(mode) &&
        field(
          'password',
          mode === 'reset' ? 'New password' : 'Password',
          'password',
          'Use 15 to 128 characters. Use a test-only password.',
        )}
      <div className="account-form__actions">
        <Button type="submit" pending={pending} pendingLabel="Please wait…">
          {labels[mode]}
        </Button>
        {mode === 'login' && onGuest && (
          <Button variant="secondary" disabled={pending} onClick={() => run(onGuest)}>
            Continue as guest
          </Button>
        )}
      </div>
      {mode === 'login' && onGuest && (
        <p>
          Temporary testing: opens a fresh guest diary. Refresh keeps it; signing out ends access.
        </p>
      )}
      {mode === 'verify' && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => onResend({ email: draft.email }))}
        >
          Request a new code
        </Button>
      )}
      {pending && <p role="status">Please wait. Your input is kept.</p>}
      {failure && <p role="alert">{failure}</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}
