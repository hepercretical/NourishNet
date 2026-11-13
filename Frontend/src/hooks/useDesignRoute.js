import { useEffect, useState } from 'react';
import { isLocalDemo } from '../services/localDemo.js';

const readRoute = () =>
  window.location.hash.slice(1) || (isLocalDemo() ? '/app/dashboard' : '/dashboard');

export function useDesignRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const navigate = () => setRoute(readRoute());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  return route;
}
