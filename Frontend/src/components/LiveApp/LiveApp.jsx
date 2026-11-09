import { useEffect, useRef, useState } from 'react';
import { accountRequest } from '../../services/accounts.js';
import AccountForm from '../AccountForm/AccountForm.jsx';
import AccountDiary from '../AccountDiary/AccountDiary.jsx';
import FoodSearch from '../FoodSearch/FoodSearch.jsx';
import Button from '../Button/Button.jsx';
import { ErrorState, LoadingState } from '../DataState/DataState.jsx';
import './LiveApp.css';

const titles = {
  signup: 'Create a fictional account',
  login: 'Sign in to NourishNet',
  verify: 'Verify your fictional email',
  recover: 'Recover your account',
  reset: 'Choose a new password',
};
export default function LiveApp({ route }) {
  const [session, setSession] = useState({ status: 'loading', account: null });
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const main = useRef(null);
  const generation = useRef(0);
  const logoutLock = useRef(false);
  const requested = route.split('/')[2] || 'dashboard';
  const mode = Object.hasOwn(titles, requested) ? requested : 'login';
  useEffect(() => {
    const controller = new AbortController();
    const version = generation.current;
    accountRequest('/auth/session', { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted && version === generation.current)
          setSession({ status: 'ready', account: result.account });
      })
      .catch((error) => {
        if (!controller.signal.aborted && version === generation.current)
          setSession({ status: error.status === 401 ? 'ready' : 'error', account: null });
      });
    const expire = () => {
      generation.current += 1;
      setSession({ status: 'ready', account: null });
      setNotice('Your session expired. Sign in again.');
      window.location.hash = '/app/login';
    };
    window.addEventListener('nourishnet:expired', expire);
    return () => {
      controller.abort();
      window.removeEventListener('nourishnet:expired', expire);
    };
  }, [attempt]);
  useEffect(() => {
    main.current?.focus();
  }, [route, session.account?.id]);
  async function submit(body) {
    const result = await accountRequest(`/auth/${mode}`, { body });
    setEmail(body.email);
    if (mode === 'login') {
      generation.current += 1;
      setSession({ status: 'ready', account: result.account });
      setNotice('');
      window.location.hash = '/app/dashboard';
    } else {
      setNotice(result.message);
      window.location.hash =
        mode === 'signup' ? '/app/verify' : mode === 'recover' ? '/app/reset' : '/app/login';
    }
    return result;
  }
  async function logout() {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLoggingOut(true);
    try {
      await accountRequest('/auth/logout', { body: {} });
      generation.current += 1;
      setSession({ status: 'ready', account: null });
      setEmail('');
      setNotice('Signed out. Your private diary is cleared.');
      window.location.hash = '/app/login';
    } catch {
      setNotice('Sign out could not be completed. Try again.');
    } finally {
      logoutLock.current = false;
      setLoggingOut(false);
    }
  }
  return (
    <div className="live-app">
      <a
        className="design-action"
        href="#live-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <header className="live-app__header">
        <a href="#/app/dashboard">NourishNet</a>
        <nav aria-label="Development app navigation">
          <a href="#/app/dashboard">Diary</a>
          <a href="#/app/search">Search foods</a>
          <a href="#/design">Screen designs</a>
          {session.account && (
            <Button pending={loggingOut} onClick={logout}>
              Sign out
            </Button>
          )}
        </nav>
      </header>
      <p className="live-app__notice">
        Internal development · Adults 18+ · Fictional accounts and test-only passwords. Account data
        is saved locally. No external email is sent.
      </p>
      <main ref={main} id="live-content" tabIndex={-1}>
        {notice && <p role="status">{notice}</p>}
        {session.status === 'loading' ? (
          <>
            <h1>Opening your diary</h1>
            <LoadingState message="Checking your session…" />
          </>
        ) : session.status === 'error' ? (
          <>
            <h1>Local API unavailable</h1>
            <ErrorState
              message="Start the local API and database, then try again."
              onRetry={() => {
                setSession({ status: 'loading', account: null });
                setAttempt((value) => value + 1);
              }}
            />
          </>
        ) : session.account ? (
          requested === 'search' ? (
            <FoodSearch key={session.account.id} />
          ) : (
            <AccountDiary key={session.account.id} account={session.account} />
          )
        ) : (
          <>
            <h1>{titles[mode]}</h1>
            <p>
              Verification and recovery codes are in the ignored Backend/outbox folder. Use
              fictional input only.
            </p>
            <AccountForm
              key={`${mode}-${email}`}
              mode={mode}
              initialEmail={email}
              onSubmit={submit}
              onResend={(body) => accountRequest('/auth/resend', { body })}
            />
            <nav className="live-app__links" aria-label="Account actions">
              <a href="#/app/signup">Create account</a>
              <a href="#/app/login">Sign in</a>
              <a href="#/app/verify">Verify email</a>
              <a href="#/app/recover">Forgot password</a>
              <a href="#/app/reset">Enter recovery code</a>
            </nav>
          </>
        )}
      </main>
      <footer>
        <a href="#/privacy">Privacy (planned)</a> · <a href="#/terms">Terms (planned)</a>
      </footer>
    </div>
  );
}
