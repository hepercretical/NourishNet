import { useAppRoute } from './hooks/useAppRoute.js';
import { isAppRoute } from './utils/appRoutes.js';
import LiveApp from './components/LiveApp/LiveApp.jsx';
import PageNotFound from './components/PageNotFound/PageNotFound.jsx';

export default function App() {
  const route = useAppRoute();
  return isAppRoute(route) ? <LiveApp route={route} /> : <PageNotFound />;
}
