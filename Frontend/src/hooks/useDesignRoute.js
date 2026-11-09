import { useEffect, useState } from 'react';

const readRoute = () => window.location.hash.slice(1) || '/dashboard';

export function useDesignRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const navigate = () => setRoute(readRoute());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  return route;
}
