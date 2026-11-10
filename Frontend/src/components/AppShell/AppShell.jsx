import TrackerNavigation from '../TrackerNavigation/TrackerNavigation.jsx';
import './AppShell.css';

export default function AppShell({ route, children }) {
  return (
    <div className="app-shell">
      <a
        className="app-shell__skip"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to main content
      </a>
      <TrackerNavigation route={route} preview />
      <div className="app-shell__notice">
        <strong>Internal screen design preview</strong> · Fictional data only. Nothing is saved,
        scanned, uploaded, calculated, or shared. Do not enter personal information.
      </div>
      <div className="app-shell__layout">{children}</div>
      <footer className="app-shell__footer">
        <nav className="app-shell__footer-links" aria-label="Account and information">
          {import.meta.env.DEV && (
            <a href="?demo=1#/app/dashboard">Try local diary without login</a>
          )}
          <a href="#/design">All screen designs</a>
          <a href="#/settings">Settings</a>
          <a href="#/privacy">Privacy (planned)</a>
          <a href="#/terms">Terms (planned)</a>
          <a href="#/settings/rights">Account rights (planned)</a>
          <a href="#/development">Local API check</a>
        </nav>
        <p>Adults 18+ · Internal development; public onboarding is unavailable.</p>
      </footer>
    </div>
  );
}
