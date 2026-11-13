function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

// Frames stay in this browser. Decoder assets come from the app build, never a
// CDN. Media permission is requested only when the caller starts this operation.
export async function openBarcodeCamera(video, onBarcode, { signal, onError } = {}) {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error('Camera capture is unavailable. Enter the barcode manually.');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  let controls;
  let finished = false;
  function stop() {
    if (finished) return;
    finished = true;
    signal?.removeEventListener('abort', stop);
    try {
      controls?.stop();
    } finally {
      stopTracks(stream);
      if (video.srcObject === stream) video.srcObject = null;
    }
  }
  signal?.addEventListener('abort', stop, { once: true });
  try {
    if (signal?.aborted) {
      stop();
      return stop;
    }
    const [
      { BrowserMultiFormatReader },
      { barcodeHints, createBarcodeFrameDecoder, isBarcodeMiss },
    ] = await Promise.all([import('@zxing/browser'), import('./barcodeFrameDecoder.js')]);
    if (signal?.aborted) {
      stop();
      return stop;
    }
    // Apply focus only when the track advertises support. Unsupported optional
    // controls must never prevent ordinary cameras from scanning.
    const track = stream.getVideoTracks?.()[0];
    try {
      if (track?.getCapabilities?.().focusMode?.includes('continuous'))
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch {
      /* Optional focus control. */
    }
    if (signal?.aborted) {
      stop();
      return stop;
    }
    const decodeFrame = createBarcodeFrameDecoder();
    class ProductReader extends BrowserMultiFormatReader {
      decodeFromCanvas(canvas) {
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Camera frames could not be read.');
        return decodeFrame(context.getImageData(0, 0, canvas.width, canvas.height));
      }
    }
    const reader = new ProductReader(barcodeHints, {
      delayBetweenScanAttempts: 200,
      delayBetweenScanSuccess: 800,
    });
    controls = await reader.decodeFromStream(stream, video, (result, error, activeControls) => {
      if (finished || signal?.aborted) return;
      if (!result) {
        if (error && !isBarcodeMiss(error)) {
          stop();
          activeControls.stop();
          onError?.(error);
        }
        return;
      }
      // Ignore routine no-match frame errors. Stop on the first valid decoded
      // result before notifying React; duplicate callbacks cannot look up twice.
      stop();
      activeControls.stop();
      onBarcode(result.getText());
    });
    if (finished || signal?.aborted) controls.stop();
    return stop;
  } catch (error) {
    stop();
    throw error;
  }
}
