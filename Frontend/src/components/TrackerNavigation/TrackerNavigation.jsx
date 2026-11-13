import { useRef, useState } from 'react';
import { primaryRoutes } from '../../design/screens.js';
import './TrackerNavigation.css';

function Icon({ name }) {
  const paths = {
    menu: 'M3 6h18M3 12h18M3 18h18',
    barcode: 'M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14',
    diary: 'M4 5h16v14H4zM8 3v4M16 3v4M4 10h16',
    home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6',
    stats: 'M4 19V9M10 19V5M16 19v-8M22 19V3M2 21h21',
    plus: 'M12 5v14M5 12h14',
    designs: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
    settings:
      'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  };
  return (
    <svg className="tracker-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}

export default function TrackerNavigation({ route, children, preview = false }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const diaryPath = preview ? '/dashboard' : '/app/dashboard';
  const searchPath = preview ? '/search' : '/app/search';
  const trackActive =
    ['/search', '/food/', '/diary/', '/scan', '/submissions/', '/review'].some((path) =>
      route.startsWith(path),
    ) || ['/app/search', '/app/scan', '/app/submissions'].some((path) => route.startsWith(path));
  const preferencesActive = [
    '/settings',
    '/app/settings',
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
        [searchPath, 'Search foods'],
        ['/app/scan', 'Scan a product'],
        ['/app/submissions', 'My submissions'],
        ['/app/settings', 'Preferences'],
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
          <Icon name="menu" />
        </button>
        <a className="tracker-toolbar__search" href={`#${searchPath}`}>
          Search foods to log
        </a>
        <a
          className="tracker-toolbar__icon-link"
          href={preview ? '#/scan' : '#/app/scan'}
          aria-label={preview ? 'Barcode scanner design preview' : 'Scan a food barcode'}
        >
          <Icon name="barcode" />
        </a>
        <a
          className="tracker-toolbar__icon-link"
          href={`#${diaryPath}`}
          aria-label="Your daily diary"
        >
          <Icon name="diary" />
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
        {preview && (
          <>
            <a href="#/design">All screen designs</a>
            <a href="#/submissions/status">My submissions preview</a>
            <a href="#/review">Catalog review preview</a>
            <a href="#/account">Account preview</a>
            <a href="?demo=0#/app/login">Test account flows</a>
          </>
        )}
      </nav>
      <nav
        className={`tracker-tabs${preview ? '' : ' tracker-tabs--live'}`}
        aria-label="Main navigation"
      >
        <a
          href={`#${diaryPath}`}
          aria-current={route === diaryPath || route === '/app' ? 'page' : undefined}
        >
          <Icon name="home" />
          <span>Dashboard</span>
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
          <Icon name="stats" />
          <span>Stats</span>
        </a>
        <a
          className="tracker-tabs__track"
          href={`#${searchPath}`}
          aria-current={trackActive ? 'page' : undefined}
        >
          <Icon name="plus" />
          <span>Track</span>
        </a>
        {preview && (
          <a
            href="#/design"
            aria-current={
              route.startsWith('/design') || route === '/development' ? 'page' : undefined
            }
          >
            <Icon name="designs" />
            <span>Designs</span>
          </a>
        )}
        <a
          href={preview ? '#/settings' : '#/app/settings'}
          aria-current={preferencesActive ? 'page' : undefined}
        >
          <Icon name="settings" />
          <span>Preferences</span>
        </a>
      </nav>
    </>
  );
}
