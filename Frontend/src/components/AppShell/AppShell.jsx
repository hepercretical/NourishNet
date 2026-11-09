import { primaryRoutes } from '../../design/screens.js';
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
      <header className="app-shell__header">
        <a className="app-shell__brand" href="#/dashboard">
          NourishNet
        </a>
        <p className="app-shell__tagline">A clearer picture of your daily food.</p>
        <a href="#/account">Account</a>
      </header>
      <div className="app-shell__notice">
        <strong>Internal screen design preview</strong> · Fictional data only. Nothing is saved,
        scanned, uploaded, calculated, or shared. Do not enter personal information.
      </div>
      <div className="app-shell__layout">
        <nav className="app-shell__nav" aria-label="Main navigation">
          {primaryRoutes.map(([path, label]) => (
            <a key={path} href={`#${path}`} aria-current={route === path ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        {children}
      </div>
      <footer className="app-shell__footer">
        <nav className="app-shell__footer-links" aria-label="Account and information">
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
