// @vitest-environment node
import { expect, it } from 'vitest';
import {
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatOneDReader,
  RGBLuminanceSource,
  DecodeHintType,
} from '@zxing/library';
import { barcodeHints, createBarcodeFrameDecoder } from './barcodeFrameDecoder.js';

// Standards-based UPC raster fixtures, not mocked decoder results or app foods.
const patterns = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
];
function frame(code = '811620022118', { top = 170, contrast = false, noise = false } = {}) {
  const bits =
    '101' +
    [...code.slice(0, 6)].map((n) => patterns[n]).join('') +
    '01010' +
    [...code.slice(6)]
      .map((n) => patterns[n].replace(/[01]/g, (b) => (b === '1' ? '0' : '1')))
      .join('') +
    '101';
  const width = 800,
    height = 450,
    data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const index = Math.floor((x - 250) / 3);
      const bar =
        y >= top && y < top + 90 && index >= 0 && index < bits.length && bits[index] === '1';
      let value = contrast ? (bar ? 100 : 190) + Math.floor(x / 30) : bar ? 15 : 245;
      if (noise) value += ((x * 13 + y * 7) % 17) - 8;
      const p = (y * width + x) * 4;
      data[p] = data[p + 1] = data[p + 2] = value;
      data[p + 3] = 255;
    }
  return { data, width, height };
}
function rotate({ data, width, height }) {
  const next = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      next.set(
        data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4),
        (x * height + height - y - 1) * 4,
      );
  return { data: next, width: height, height: width };
}
it('reproduces the old scan miss for a sideways barcode in a rectangular camera frame', () => {
  const image = rotate(frame());
  const gray = new Uint8ClampedArray(image.width * image.height);
  for (let p = 0; p < gray.length; p++) gray[p] = image.data[p * 4];
  const hints = new Map([
    [DecodeHintType.POSSIBLE_FORMATS, barcodeHints.get(DecodeHintType.POSSIBLE_FORMATS)],
  ]);
  const oldReader = new MultiFormatOneDReader(hints);
  expect(() =>
    oldReader.decode(
      new BinaryBitmap(
        new HybridBinarizer(new RGBLuminanceSource(gray, image.width, image.height)),
      ),
      hints,
    ),
  ).toThrow();
  expect(createBarcodeFrameDecoder()(image).getText().padStart(14, '0')).toBe('00811620022118');
});
it.each([0, 1, 2, 3])(
  'decodes the actual fairlife UPC at %i quarter turns with the real ZXing decoder',
  (turns) => {
    let image = frame();
    for (let i = 0; i < turns; i++) image = rotate(image);
    expect(createBarcodeFrameDecoder()(image).getText().padStart(14, '0')).toBe('00811620022118');
  },
);
it.each([
  { top: 5 },
  { contrast: true },
  { noise: true },
  { top: 340, contrast: true, noise: true },
])('reads off-center and unevenly lit camera pixels: %j', (options) => {
  expect(
    createBarcodeFrameDecoder()(frame('811620022118', options)).getText().padStart(14, '0'),
  ).toBe('00811620022118');
});
it('decodes other products instead of hardcoding the fairlife result', () => {
  expect(createBarcodeFrameDecoder()(frame('030000010204')).getText().padStart(14, '0')).toBe(
    '00030000010204',
  );
});
it('ignores blank frames and rejects a damaged check digit rather than inventing a match', () => {
  const blank = frame();
  blank.data.fill(255);
  expect(() => createBarcodeFrameDecoder()(blank)).toThrow();
  expect(() => createBarcodeFrameDecoder()(frame('811620022119'))).toThrow();
});
