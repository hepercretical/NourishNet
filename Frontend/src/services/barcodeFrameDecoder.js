import {
  BarcodeFormat,
  ChecksumException,
  DecodeHintType,
  GlobalHistogramBinarizer,
  FormatException,
  MultiFormatOneDReader,
  NotFoundException,
  RGBLuminanceSource,
} from '@zxing/library';

export const barcodeHints = new Map([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.UPC_A, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.ITF],
  ],
  [DecodeHintType.TRY_HARDER, true],
]);

export function isBarcodeMiss(error) {
  return (
    error instanceof NotFoundException ||
    error instanceof ChecksumException ||
    error instanceof FormatException
  );
}

// Pure pixel decoder, shared by the live camera and real-decoder regression
// tests. Explicit rotation keeps width/height correct for rectangular frames.
export function createBarcodeFrameDecoder() {
  const reader = new MultiFormatOneDReader(barcodeHints);
  return ({ data, width, height }) => {
    const gray = new Uint8ClampedArray(width * height);
    for (let p = 0; p < gray.length; p++) {
      const i = p * 4;
      gray[p] = data[i + 3] === 0 ? 255 : (data[i] + 2 * data[i + 1] + data[i + 2]) / 4;
    }
    const rotated = new Uint8ClampedArray(gray.length);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) rotated[x * height + height - y - 1] = gray[y * width + x];
    for (const [pixels, w, h] of [
      [gray, width, height],
      [rotated, height, width],
    ]) {
      const source = new RGBLuminanceSource(pixels, w, h);
      const binarizer = new GlobalHistogramBinarizer(source);
      const seen = new Set();
      // Bound work per frame instead of testing every row of a high-resolution
      // image. Cover the full preview, prioritizing its center. Identical rows
      // need only one attempt (important for damaged/invalid check digits).
      const positions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9, 0.025, 0.975];
      for (const position of positions) {
        try {
          const y = Math.min(h - 1, Math.floor(h * position));
          const row = binarizer.getBlackRow(y, null);
          // Supported retail codes contain many alternating bars. A row along
          // the bars (rather than across them) is not a decoding candidate.
          let changes = 0;
          for (let x = 1; x < w && changes < 24; x++) if (row.get(x) !== row.get(x - 1)) changes++;
          if (changes < 24) continue;
          const key = row.getBitArray().join(',');
          if (seen.has(key)) continue;
          seen.add(key);
          for (let direction = 0; direction < 2; direction++) {
            if (direction) row.reverse();
            try {
              return reader.decodeRow(y, row, barcodeHints);
            } catch (error) {
              if (!isBarcodeMiss(error)) throw error;
            }
          }
        } catch (error) {
          // Damaged/no-match frames are expected; programming/device errors are not.
          if (!isBarcodeMiss(error)) throw error;
        }
      }
    }
    throw new NotFoundException();
  };
}
