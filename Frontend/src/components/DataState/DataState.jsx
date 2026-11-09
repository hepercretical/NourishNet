import '../shared/shared.css';
import Button from '../Button/Button.jsx';

export function LoadingState({ message = 'Loading foods. Please wait.' }) {
  return (
    <div className="shared-state" role="status">
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ title, children, actionLabel, onAction }) {
  return (
    <div className="shared-state" role="status">
      <p className="shared-notice__title">{title}</p>
      <p>{children}</p>
      {onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  message = 'Foods could not be loaded. Try again.',
  onRetry,
  pending = false,
}) {
  return (
    <div className="shared-state shared-state--error">
      <p role="alert">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} pending={pending} pendingLabel="Trying again…">
          Try again
        </Button>
      )}
    </div>
  );
}
