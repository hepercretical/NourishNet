import { useEffect, useState } from 'react';
const current = () => window.location.hash.slice(1) || '/app/dashboard';
export function useAppRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const navigate = () => setRoute(current());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  return route;
}
