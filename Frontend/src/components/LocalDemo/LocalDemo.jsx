import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { installPreviewTransport } from '../../services/previewTransport.js';
import AccountTracker from '../AccountTracker/AccountTracker.jsx';
import TrackerNavigation from '../TrackerNavigation/TrackerNavigation.jsx';
import { demoAccount, demoRequest } from '../../services/localDemo.js';
import '../LiveApp/LiveApp.css';

export default function LocalDemo({ route }) {
  useLayoutEffect(() => installPreviewTransport(demoRequest), []);
  const [notice, setNotice] = useState('');
  const main = useRef(null);
  useEffect(() => {
    main.current?.focus();
  }, [route]);
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
      <TrackerNavigation route={route} />
      <p className="live-app__notice">
        Local demo · Adults 18+ · Synthetic foods only. Changes stay in this browser. No login or
        API required.
      </p>
      <main ref={main} id="live-content" tabIndex={-1}>
        {notice && <p role="status">{notice}</p>}
        <AccountTracker account={demoAccount} route={route} onNotice={setNotice} />
      </main>
    </div>
  );
}
