import { useApiHealth } from '../hooks/useApiHealth.js';
import './ApiConnection.css';

const messages = {
  idle: 'No connection check yet. Check that your local API is running.',
  loading: 'Checking the API connection…',
  success: 'The API is running. Your local services can communicate.',
  error: 'Cannot reach the API. Start the backend, then try again.',
};

export default function ApiConnection() {
  const { status, checkConnection } = useApiHealth();

  return (
    <section className="api-connection" aria-labelledby="api-connection-heading">
      <h2 id="api-connection-heading">Local API connection</h2>
      <p role="status" aria-live="polite">
        {messages[status]}
      </p>
      <button
        className="api-connection__button"
        type="button"
        disabled={status === 'loading'}
        onClick={checkConnection}
      >
        {status === 'loading'
          ? 'Checking…'
          : status === 'error'
            ? 'Try again'
            : 'Check API connection'}
      </button>
    </section>
  );
}
