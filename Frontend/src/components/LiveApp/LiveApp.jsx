import { useEffect, useRef, useState } from 'react';
import { accountRequest } from '../../services/accounts.js';
import AccountForm from '../AccountForm/AccountForm.jsx';
import AccountTracker from '../AccountTracker/AccountTracker.jsx';
import Button from '../Button/Button.jsx';
import { ErrorState, LoadingState } from '../DataState/DataState.jsx';
import './LiveApp.css';
import TrackerNavigation from '../TrackerNavigation/TrackerNavigation.jsx';
import { usesNeonAuth } from '../../services/hostedConfig.js';

const titles = {
  signup: 'Create a fictional account',
  login: 'Sign in to NourishNet',
  verify: 'Verify your fictional email',
  recover: 'Recover your account',
  reset: 'Choose a new password',
  profile: 'Complete your account setup',
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
  const mode = session.needsProfile
    ? 'profile'
    : Object.hasOwn(titles, requested)
      ? requested
      : 'login';
  useEffect(() => {
    const featureTitles = {
      dashboard: 'Your daily diary',
      search: 'Search foods',
      scan: 'Scan a food barcode',
      submissions: 'Your product submissions',
      settings: 'Preferences',
    };
    const title =
      session.status === 'loading'
        ? 'Opening your diary'
        : session.status === 'error'
          ? 'API unavailable'
          : session.account
            ? featureTitles[requested] || 'Your daily diary'
            : titles[mode];
    document.title = `NourishNet | ${title}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        'NourishNet food diary: search foods, review servings, scan barcodes and track recorded nutrition.',
      );
  }, [requested, mode, session.status, session.account]);
  useEffect(() => {
    const controller = new AbortController();
    const version = generation.current;
    accountRequest('/auth/session', { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted && version === generation.current)
          setSession({
            status: 'ready',
            account: result.account,
            needsProfile: result.needsProfile,
          });
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
    const payload =
      mode === 'profile'
        ? { adult: body.adult, displayName: body.displayName, timeZone: body.timeZone }
        : body;
    const result = await accountRequest(`/auth/${mode}`, { body: payload });
    setEmail(body.email);
    if (mode === 'login' || mode === 'profile') {
      generation.current += 1;
      setSession({ status: 'ready', account: result.account, needsProfile: result.needsProfile });
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
        className="live-app__skip"
        href="#live-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <TrackerNavigation route={route}>
        {(session.account || session.needsProfile) && (
          <Button pending={loggingOut} onClick={logout}>
            Sign out
          </Button>
        )}
      </TrackerNavigation>
      {usesNeonAuth ? (
        <p className="live-app__notice">
          Internal hosted testing · Approved tester accounts only. Use fictional diary data. Neon
          delivers authentication emails.
        </p>
      ) : (
        <p className="live-app__notice">
          Internal development · Fictional accounts and test-only passwords. Account data is saved
          locally. No external email is sent.
        </p>
      )}
      <main ref={main} id="live-content" tabIndex={-1}>
        {notice && <p role="status">{notice}</p>}
        {session.status === 'loading' ? (
          <>
            <h1>Opening your diary</h1>
            <LoadingState message="Checking your session…" />
          </>
        ) : session.status === 'error' ? (
          <>
            <h1>{usesNeonAuth ? 'Hosted API unavailable' : 'Local API unavailable'}</h1>
            <ErrorState
              message={
                usesNeonAuth
                  ? 'The hosted service could not be reached. Try again.'
                  : 'Start the local API and database, then try again.'
              }
              onRetry={() => {
                setSession({ status: 'loading', account: null });
                setAttempt((value) => value + 1);
              }}
            />
          </>
        ) : session.account ? (
          <AccountTracker
            key={session.account.id}
            account={session.account}
            route={route}
            onNotice={setNotice}
          />
        ) : (
          <>
            <h1>{titles[mode]}</h1>
            {usesNeonAuth ? (
              <p>
                Use an approved tester mailbox and fictional profile details. Complete account setup
                after verifying your email.
              </p>
            ) : (
              <p>
                Verification and recovery codes are in the ignored Backend/outbox folder. Use
                fictional input only.
              </p>
            )}
            <AccountForm
              key={`${mode}-${email}`}
              mode={mode}
              hosted={usesNeonAuth}
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
    </div>
  );
}
