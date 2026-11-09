import '../shared/shared.css';
import { useRef, useState } from 'react';
import { usePendingAction } from '../../hooks/usePendingAction.js';
import Button from '../Button/Button.jsx';
import { ErrorState } from '../DataState/DataState.jsx';
import FormField from '../FormField/FormField.jsx';

export default function SearchForm({ query, onQueryChange, onSearch }) {
  const [error, setError] = useState();
  const formRef = useRef(null);
  const { pending, failed, run } = usePendingAction();

  function submit(event) {
    event.preventDefault();
    if (pending) return;
    if (!query.trim()) {
      setError('Enter a food name, such as rolled oats.');
      formRef.current.querySelector('input').focus();
      return;
    }
    setError(undefined);
    return run(() => onSearch(query.trim()));
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-label="Food search" aria-busy={pending}>
      <FormField label="Search foods" hint="Search by food or product name." error={error}>
        {(props) => (
          <input
            {...props}
            type="search"
            required
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            disabled={pending}
          />
        )}
      </FormField>
      <Button type="submit" pending={pending} pendingLabel="Searching…">
        Search foods
      </Button>
      {pending && (
        <p className="shared-form-feedback" role="status">
          Searching foods. Your search text is kept.
        </p>
      )}
      {failed && (
        <ErrorState
          message="Foods could not be searched. Your search text is kept. Try again."
          onRetry={() => formRef.current.requestSubmit()}
        />
      )}
    </form>
  );
}
