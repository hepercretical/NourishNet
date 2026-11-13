import { useEffect, useRef, useState } from 'react';
import { lookupBarcode } from '../../services/foods.js';
import { openBarcodeCamera } from '../../services/barcodeCamera.js';
import AddFood from '../AddFood/AddFood.jsx';
import Button from '../Button/Button.jsx';
import FoodCard from '../FoodCard/FoodCard.jsx';
import { ErrorState, LoadingState } from '../DataState/DataState.jsx';
import './BarcodeScanner.css';

export default function BarcodeScanner({ initialMeal = '', onSave, onUnknown }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState({ amount: '1', meal: initialMeal });
  const [pending, setPending] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraState, setCameraState] = useState('idle');
  const [scanHelp, setScanHelp] = useState(false);
  const video = useRef(null);
  const camera = useRef(null);
  const request = useRef(null);
  const locked = useRef(false);
  const active = useRef(true);
  const lastCode = useRef('');
  useEffect(() => {
    if (cameraState !== 'scanning') return;
    const timer = setTimeout(() => setScanHelp(true), 8000);
    return () => clearTimeout(timer);
  }, [cameraState]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      camera.current?.abort();
      request.current?.abort();
    };
  }, []);
  function stopCamera() {
    camera.current?.abort();
    camera.current = null;
    if (active.current) {
      setCameraState('idle');
      setScanHelp(false);
    }
  }
  async function lookup(value) {
    if (locked.current || !active.current) return;
    locked.current = true;
    stopCamera();
    const controller = new AbortController();
    request.current = controller;
    lastCode.current = value;
    setCode(value);
    setLookupError('');
    setResult(null);
    setPending(true);
    try {
      const next = await lookupBarcode(value, { signal: controller.signal });
      if (controller.signal.aborted || !active.current) return;
      setResult(next);
      setDraft({ amount: '1', meal: initialMeal });
      if (next.foods.length === 1) setSelected(next.foods[0]);
    } catch (error) {
      if (error.name !== 'AbortError' && active.current)
        setLookupError(
          error.status === 400
            ? error.message
            : 'The barcode could not be looked up. Your code is kept. Try again.',
        );
    } finally {
      locked.current = false;
      if (active.current) setPending(false);
    }
  }
  async function startCamera() {
    if (locked.current || camera.current) return;
    const controller = new AbortController();
    camera.current = controller;
    setCameraError('');
    setCameraState('starting');
    try {
      await openBarcodeCamera(
        video.current,
        (value) => {
          stopCamera();
          void lookup(value);
        },
        {
          signal: controller.signal,
          onError: () => {
            if (!active.current || controller.signal.aborted) return;
            stopCamera();
            setCameraError(
              'The camera preview opened, but barcode detection stopped. Try again or enter the printed barcode below.',
            );
          },
        },
      );
      if (!controller.signal.aborted && active.current) setCameraState('scanning');
    } catch {
      if (!controller.signal.aborted && active.current) {
        stopCamera();
        setCameraError(
          'The camera could not start or permission was denied. Check browser permissions, try again, or enter the barcode below.',
        );
      }
    }
  }
  if (selected)
    return (
      <AddFood
        food={selected}
        draft={draft}
        onDraftChange={setDraft}
        onBack={() => setSelected(null)}
        onSave={onSave}
        backLabel="Back to barcode results"
      />
    );
  return (
    <section className="barcode-scanner" aria-label="Barcode scanner">
      <h1>Scan a food barcode</h1>
      <p>
        Scan a product or enter its printed barcode. Review the matched food, serving and meal
        before saving.
      </p>
      <p>The camera is used only for barcode detection on this device. Video is not uploaded.</p>
      <video
        ref={video}
        className="barcode-scanner__video"
        aria-label="Barcode camera preview"
        muted
        playsInline
        autoPlay
        hidden={cameraState === 'idle'}
      />
      <div className="barcode-scanner__actions">
        <Button onClick={startCamera} disabled={pending || cameraState !== 'idle'}>
          Start camera
        </Button>
        {cameraState !== 'idle' && (
          <Button variant="secondary" onClick={stopCamera}>
            Stop camera
          </Button>
        )}
      </div>
      {cameraState === 'starting' && (
        <LoadingState message="Opening the camera. You can stop while permission is pending." />
      )}
      {cameraState === 'scanning' && (
        <p role="status">
          Looking for a barcode. Fill the center of the preview with the whole barcode, including
          the blank space at both ends. Hold steady and move back slightly if it is blurry.
        </p>
      )}
      {scanHelp && (
        <p role="status">
          Still looking. Try more light without glare, rotate the bottle, or use the printed number
          below. For the fairlife 11.5 fl oz chocolate bottle, enter 811620022118.
        </p>
      )}
      {cameraError && <ErrorState message={cameraError} onRetry={startCamera} />}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(code);
        }}
        className="shared-form"
      >
        <div className="shared-field">
          <label className="shared-field__label" htmlFor="product-barcode">
            Barcode number
          </label>
          <input
            id="product-barcode"
            className="shared-field__control"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            disabled={pending}
            aria-describedby="barcode-help barcode-feedback"
            aria-invalid={!!lookupError || undefined}
          />
          <p id="barcode-help">
            Enter all 8, 12, 13 or 14 digits, including leading zeros. For UPC-E, use the full UPC-A
            number.
          </p>
          <div id="barcode-feedback">{lookupError && <p role="alert">{lookupError}</p>}</div>
        </div>
        <Button type="submit" pending={pending} pendingLabel="Looking up barcode…">
          Find product
        </Button>
      </form>
      {lookupError && (
        <Button onClick={() => lookup(lastCode.current)} disabled={pending}>
          Try lookup again
        </Button>
      )}
      {pending && <LoadingState message="Looking for a matching catalog food." />}
      {result?.status === 'unknown' && (
        <div role="status">
          <h2>Product not in this catalog</h2>
          <p>
            No reviewed food matches barcode {result.barcode.input}. Search by name or check the
            printed digits.
          </p>
          {onUnknown && (
            <>
              <p>
                Submit a photo of the package front and its nutrition label so the product can be
                reviewed for the catalog.
              </p>
              <Button onClick={() => onUnknown(result.barcode.input)}>
                Submit package and label photos
              </Button>
            </>
          )}
        </div>
      )}
      {result?.status === 'found' && (
        <section aria-label="Matching food servings">
          <h2>Choose a serving</h2>
          {result.foods.map((food) => (
            <FoodCard key={food.servingId} {...food} onSelect={() => setSelected(food)} />
          ))}
        </section>
      )}
      <a className="design-action" href="#/app/search">
        Search foods by name
      </a>
      <a className="design-action" href="#/app/dashboard">
        Back to diary
      </a>
    </section>
  );
}
