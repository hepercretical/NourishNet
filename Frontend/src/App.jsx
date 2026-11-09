import { useEffect, useRef } from 'react';
import AppShell from './components/AppShell.jsx';
import { screens } from './design/screens.js';
import { useDesignRoute } from './hooks/useDesignRoute.js';
import DesignIndex from './pages/DesignIndex.jsx';
import DevelopmentSetup from './pages/DevelopmentSetup.jsx';
import ScreenDesign from './pages/ScreenDesign.jsx';

export default function App() {
  const route = useDesignRoute();
  const mainRef = useRef(null);
  const screen = screens[route];
  const title =
    screen?.title ||
    (route === '/design'
      ? 'All screen designs'
      : route === '/development'
        ? 'Development setup'
        : 'Page not found');

  useEffect(() => {
    document.title = `NourishNet | ${title}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        `NourishNet internal screen design: ${title}. Fictional examples only.`,
      );
    mainRef.current?.focus();
  }, [route, title]);

  if (route === '/development') {
    return (
      <>
        <a className="design-action" href="#/design">
          Return to screen designs
        </a>
        <DevelopmentSetup />
      </>
    );
  }

  return (
    <AppShell route={route}>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {screen ? (
          <ScreenDesign key={route} screen={screen} route={route} />
        ) : route === '/design' ? (
          <DesignIndex />
        ) : (
          <>
            <h1>Page not found</h1>
            <p>This NourishNet screen is not available. Choose a screen from the design map.</p>
            <a className="design-action" href="#/design">
              Browse all screen designs
            </a>
          </>
        )}
      </main>
    </AppShell>
  );
}
