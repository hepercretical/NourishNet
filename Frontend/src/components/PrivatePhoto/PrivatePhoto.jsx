import { useEffect, useState } from 'react';
import { usesNeonAuth } from '../../services/hostedConfig.js';
import { loadPrivatePhoto } from '../../services/privatePhotos.js';
import Button from '../Button/Button.jsx';

export default function PrivatePhoto({ src, alt, className }) {
  const [state, setState] = useState({}),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!usesNeonAuth) return;
    const controller = new AbortController();
    let objectUrl;
    loadPrivatePhoto(src, { signal: controller.signal })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ src, url: objectUrl, attempt });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ src, error: true, attempt });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, attempt]);
  if (!usesNeonAuth) return <img src={src} alt={alt} className={className} />;
  if (state.src !== src || state.attempt !== attempt)
    return <p role="status">Loading {alt.toLowerCase()}…</p>;
  if (state.error)
    return (
      <div>
        <p role="alert">{alt} could not be loaded.</p>
        <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
          Retry {alt.toLowerCase()}
        </Button>
      </div>
    );
  return <img src={state.url} alt={alt} className={className} />;
}
