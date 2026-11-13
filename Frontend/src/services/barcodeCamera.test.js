import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { openBarcodeCamera } from './barcodeCamera.js';
const { decode, Reader } = vi.hoisted(() => {
  const decode = vi.fn();
  return {
    decode,
    Reader: vi.fn(function () {
      return { decodeFromStream: decode };
    }),
  };
});
vi.mock('@zxing/browser', () => ({ BrowserMultiFormatReader: Reader }));
vi.mock('@zxing/library', () => ({
  BarcodeFormat: { UPC_A: 1, EAN_13: 2, EAN_8: 3, ITF: 4 },
  DecodeHintType: { POSSIBLE_FORMATS: 1 },
}));
let tracks, stream, video, media, controls;
beforeEach(() => {
  vi.clearAllMocks();
  tracks = [{ stop: vi.fn() }];
  stream = { getTracks: () => tracks };
  video = document.createElement('video');
  media = vi.fn().mockResolvedValue(stream);
  controls = { stop: vi.fn() };
  decode.mockResolvedValue(controls);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: media } });
});
afterEach(() => vi.unstubAllGlobals());
it('requests video only, limits barcode formats, and stops all resources after one detection', async () => {
  const found = vi.fn(),
    controller = new AbortController();
  await openBarcodeCamera(video, found, { signal: controller.signal });
  expect(media).toHaveBeenCalledWith({
    audio: false,
    video: { facingMode: { ideal: 'environment' } },
  });
  const callback = decode.mock.calls[0][2];
  callback({ getText: () => '030000010204' }, null, controls);
  callback({ getText: () => '030000010204' }, null, controls);
  expect(found).toHaveBeenCalledExactlyOnceWith('030000010204');
  expect(tracks[0].stop).toHaveBeenCalled();
  expect(controls.stop).toHaveBeenCalled();
  expect(Reader.mock.calls[0][0].get(1)).toEqual([1, 2, 3, 4]);
});
it('stops tracks obtained after a cancelled permission request without starting decoding', async () => {
  let resolve;
  media.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const controller = new AbortController();
  const pending = openBarcodeCamera(video, vi.fn(), { signal: controller.signal });
  controller.abort();
  resolve(stream);
  await pending;
  expect(tracks[0].stop).toHaveBeenCalledOnce();
  expect(decode).not.toHaveBeenCalled();
});
it('releases the stream on navigation abort and ignores ordinary no-match frames', async () => {
  const controller = new AbortController(),
    found = vi.fn();
  await openBarcodeCamera(video, found, { signal: controller.signal });
  decode.mock.calls[0][2](undefined, new Error('no barcode in this frame'), controls);
  expect(found).not.toHaveBeenCalled();
  controller.abort();
  expect(tracks[0].stop).toHaveBeenCalled();
  expect(controls.stop).toHaveBeenCalled();
});
it('releases camera tracks if decoder initialization fails', async () => {
  decode.mockRejectedValueOnce(new Error('decoder unavailable'));
  await expect(openBarcodeCamera(video, vi.fn())).rejects.toThrow('decoder unavailable');
  expect(tracks[0].stop).toHaveBeenCalled();
});
it('preserves explicit permission errors and offers manual entry when media capture is unsupported', async () => {
  media.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
  await expect(openBarcodeCamera(video, vi.fn())).rejects.toMatchObject({
    name: 'NotAllowedError',
  });
  vi.stubGlobal('navigator', {});
  await expect(openBarcodeCamera(video, vi.fn())).rejects.toThrow('Enter the barcode manually');
});
