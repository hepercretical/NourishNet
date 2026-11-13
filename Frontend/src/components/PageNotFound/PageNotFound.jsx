import { useEffect, useRef } from 'react';
export default function PageNotFound() {
  const main = useRef(null);
  useEffect(() => {
    document.title = 'NourishNet | Page not found';
    main.current?.focus();
  }, []);
  return (
    <main ref={main} tabIndex={-1}>
      <h1>Page not found</h1>
      <p>This address does not open a NourishNet feature.</p>
      <a className="design-action" href="#/app/dashboard">
        Open your diary
      </a>
    </main>
  );
}
