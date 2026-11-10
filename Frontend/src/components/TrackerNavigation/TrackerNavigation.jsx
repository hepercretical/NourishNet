import { useRef, useState } from 'react';
import { primaryRoutes } from '../../design/screens.js';
import './TrackerNavigation.css';

export default function TrackerNavigation({ route, children, preview = false }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const diaryPath = preview ? '/dashboard' : '/app/dashboard';
  const searchPath = preview ? '/search' : '/app/search';
  const trackActive =
    ['/search', '/food/', '/diary/', '/scan', '/submissions/', '/review'].some((path) =>
      route.startsWith(path),
    ) || route.startsWith('/app/search');
  const preferencesActive = [
    '/settings',
    '/account',
    '/app/login',
    '/app/signup',
    '/app/verify',
    '/app/recover',
    '/app/reset',
    '/goals',
    '/connections',
    '/privacy',
    '/terms',
  ].some((path) => route.startsWith(path));
  const menuLinks = preview
    ? primaryRoutes
    : [
        [diaryPath, 'Daily diary'],
        ['/goals', 'Goals preview'],
        ['/connections', 'Connections preview'],
        ['/calendar', 'Calendar preview'],
      ];
  return (
    <>
      <header className="tracker-toolbar">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="tracker-menu"
          ref={menuButton}
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
        <a className="tracker-toolbar__search" href={`#${searchPath}`}>
          Search foods to log
        </a>
        <a href="#/scan" aria-label="Barcode scanner design preview">
          ▥
        </a>
        <a href={`#${diaryPath}`} aria-label="Your daily diary">
          ▤
        </a>
      </header>
      {children && <div className="live-app__links">{children}</div>}
      <nav
        id="tracker-menu"
        className="tracker-menu"
        aria-label="Tracker menu"
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        {menuLinks.map(([path, label]) => (
          <a
            key={path}
            href={`#${path}`}
            aria-current={route === path ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
        <a href="#/design">All screen designs</a>
        <a href="#/submissions/status">My submissions preview</a>
        <a href="#/review">Catalog review preview</a>
        <a href="#/account">Account preview</a>
        <a href="?demo=0#/app/login">Test account flows</a>
      </nav>
      <nav className="tracker-tabs" aria-label="Main navigation">
        <a
          href={`#${diaryPath}`}
          aria-current={route === diaryPath || route === '/app' ? 'page' : undefined}
        >
          <span aria-hidden="true">⌂</span>Dashboard
        </a>
        <a
          href={`#${diaryPath}`}
          aria-current={route.startsWith('/calendar') ? 'page' : undefined}
          onClick={(event) => {
            const summary = document.getElementById('daily-summary');
            if (summary) {
              event.preventDefault();
              summary.focus();
              summary.scrollIntoView?.();
            }
          }}
        >
          <span aria-hidden="true">▥</span>Stats
        </a>
        <a
          className="tracker-tabs__track"
          href={`#${searchPath}`}
          aria-current={trackActive ? 'page' : undefined}
        >
          <span aria-hidden="true">＋</span>Track
        </a>
        <a
          href="#/design"
          aria-current={
            route.startsWith('/design') || route === '/development' ? 'page' : undefined
          }
        >
          <span aria-hidden="true">☷</span>Designs
        </a>
        <a href="#/settings" aria-current={preferencesActive ? 'page' : undefined}>
          <span aria-hidden="true">⚙</span>Preferences
        </a>
      </nav>
    </>
  );
}
