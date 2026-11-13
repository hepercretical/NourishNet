function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

// Frames stay in this browser. Decoder assets come from the app build, never a
// CDN. Media permission is requested only when the caller starts this operation.
export async function openBarcodeCamera(video, onBarcode, { signal } = {}) {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error('Camera capture is unavailable. Enter the barcode manually.');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' } },
  });
  let controls;
  let finished = false;
  function stop() {
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
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ]);
    if (signal?.aborted) {
      stop();
      return stop;
    }
    const formats = [
      BarcodeFormat.UPC_A,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
    ];
    const reader = new BrowserMultiFormatReader(
      new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]),
      { delayBetweenScanAttempts: 400, delayBetweenScanSuccess: 800 },
    );
    controls = await reader.decodeFromStream(stream, video, (result, _error, activeControls) => {
      if (!result || finished || signal?.aborted) return;
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
