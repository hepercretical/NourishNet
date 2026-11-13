import { useEffect, useRef, useState } from 'react';
import { photoError } from '../../utils/submissionDraft.js';
import Button from '../Button/Button.jsx';
import './ProductPhoto.css';

export default function ProductPhoto({
  kind,
  title,
  file,
  onChange,
  error = '',
  disabled = false,
  existingUrl,
}) {
  const preview = useRef(null);
  const [selectionError, setSelectionError] = useState('');
  useEffect(() => {
    if (!file || !preview.current) return;
    const node = preview.current;
    const url = URL.createObjectURL(file);
    node.src = url;
    return () => {
      node.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [file]);
  const message = selectionError || error;
  return (
    <fieldset className="product-photo" disabled={disabled}>
      <legend>{title}</legend>
      <label htmlFor={`photo-${kind}`}>
        {file || existingUrl ? `Replace ${title.toLowerCase()}` : `Choose ${title.toLowerCase()}`}
      </label>
      <input
        id={`photo-${kind}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-invalid={!!message || undefined}
        aria-describedby={`photo-${kind}-hint photo-${kind}-error`}
        onChange={(event) => {
          const next = event.target.files?.[0];
          event.target.value = '';
          if (!next) return;
          const invalid = photoError(next);
          setSelectionError(invalid);
          if (!invalid) onChange(next);
        }}
      />
      <p id={`photo-${kind}-hint`}>
        JPEG, PNG or WebP, up to 5 MB. Include only the product; avoid faces, receipts and personal
        details.
      </p>
      {file && (
        <>
          <img ref={preview} className="product-photo__preview" alt={`${title} preview`} />
          <p>{file.name}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectionError('');
              onChange(null);
            }}
          >
            Remove {title.toLowerCase()}
          </Button>
        </>
      )}
      {!file && existingUrl && (
        <img className="product-photo__preview" src={existingUrl} alt={`${title} current upload`} />
      )}
      <div id={`photo-${kind}-error`}>{message && <p role="alert">{message}</p>}</div>
    </fieldset>
  );
}
