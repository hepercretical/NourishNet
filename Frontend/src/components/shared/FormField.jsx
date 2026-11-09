import { useId } from 'react';

export default function FormField({ label, hint, error, children }) {
  const id = useId();
  const description = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className="shared-field">
      <label className="shared-field__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="shared-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children({
        id,
        className: 'shared-field__control',
        'aria-invalid': error ? true : undefined,
        'aria-describedby': description || undefined,
      })}
      {error && (
        <p className="shared-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
