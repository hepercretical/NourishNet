import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import BarcodeScanner from './BarcodeScanner.jsx';
import { lookupBarcode } from '../../services/foods.js';
import { openBarcodeCamera } from '../../services/barcodeCamera.js';

vi.mock('../../services/foods.js', () => ({ lookupBarcode: vi.fn() }));
vi.mock('../../services/barcodeCamera.js', () => ({ openBarcodeCamera: vi.fn() }));
const food = {
  id: 'food',
  servingId: 'serving',
  name: 'Quaker Old Fashioned Oats (18 oz canister)',
  servingBasis: '1/2 cup dry (40 g)',
  grams: 40,
  nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: 0 },
};
const found = {
  status: 'found',
  barcode: { input: '030000010204', gtin14: '00030000010204' },
  foods: [food],
};
beforeEach(() => {
  vi.resetAllMocks();
});
it('looks up a manual barcode, confirms the meal and scaled nutrition, and retries one save key', async () => {
  const user = userEvent.setup();
  lookupBarcode.mockResolvedValue(found);
  const save = vi.fn().mockRejectedValueOnce(new Error('private')).mockResolvedValueOnce();
  render(<BarcodeScanner initialMeal="Lunch" onSave={save} />);
  expect(openBarcodeCamera).not.toHaveBeenCalled();
  await user.type(screen.getByRole('textbox', { name: 'Barcode number' }), '030000010204{Enter}');
  expect(await screen.findByRole('heading', { name: 'Choose serving and meal' })).toBeVisible();
  expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Lunch');
  await user.clear(screen.getByRole('textbox', { name: 'Serving amount' }));
  await user.type(screen.getByRole('textbox', { name: 'Serving amount' }), '1.5{Enter}');
  expect(screen.getByText('225 kcal')).toBeVisible();
  expect(save).not.toHaveBeenCalled();
  await user.dblClick(screen.getByRole('button', { name: 'Save entry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your choices are kept');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
  expect(save.mock.calls[0][0]).toMatchObject({ servingId: 'serving', amount: 1.5, meal: 'Lunch' });
});
it('keeps unknown products distinct and does not save or pretend a submission succeeded', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  lookupBarcode.mockResolvedValue({ ...found, status: 'unknown', foods: [] });
  render(<BarcodeScanner onSave={save} />);
  await user.type(screen.getByLabelText('Barcode number'), '030000010204{Enter}');
  expect(await screen.findByText('Product not in this catalog')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Search foods by name' })).toHaveAttribute(
    'href',
    '#/app/search',
  );
  expect(save).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Save entry' })).not.toBeInTheDocument();
});
it('preserves barcode input on validation/read failures and retries the submitted code', async () => {
  const user = userEvent.setup();
  lookupBarcode
    .mockRejectedValueOnce(Object.assign(new Error('Check every barcode digit.'), { status: 400 }))
    .mockRejectedValueOnce(new Error('private SQL'))
    .mockResolvedValueOnce(found);
  render(<BarcodeScanner onSave={vi.fn()} />);
  await user.type(screen.getByLabelText('Barcode number'), '030000010204{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Check every barcode digit.');
  await user.click(screen.getByRole('button', { name: 'Try lookup again' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your code is kept');
  expect(screen.queryByText('private SQL')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Barcode number')).toHaveValue('030000010204');
  await user.click(screen.getByRole('button', { name: 'Try lookup again' }));
  expect(await screen.findByRole('heading', { name: 'Choose serving and meal' })).toBeVisible();
});
it('starts the camera only on activation, stops before lookup, and ignores repeated detections', async () => {
  const user = userEvent.setup();
  let detect, cameraSignal, resolve;
  openBarcodeCamera.mockImplementation(async (_video, callback, { signal }) => {
    detect = callback;
    cameraSignal = signal;
    return vi.fn();
  });
  lookupBarcode.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { unmount } = render(<BarcodeScanner onSave={vi.fn()} />);
  expect(openBarcodeCamera).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Start camera' }));
  expect(await screen.findByRole('button', { name: 'Stop camera' })).toBeVisible();
  await act(async () => {
    detect('030000010204');
    detect('030000010204');
  });
  expect(cameraSignal.aborted).toBe(true);
  expect(lookupBarcode).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Looking up barcode…' })).toBeDisabled();
  await act(async () => resolve(found));
  expect(await screen.findByRole('heading', { name: 'Choose serving and meal' })).toBeVisible();
  unmount();
});
it('provides manual recovery after camera permission or decoder failure and supports stopping', async () => {
  const user = userEvent.setup();
  openBarcodeCamera
    .mockRejectedValueOnce(new DOMException('private device', 'NotAllowedError'))
    .mockResolvedValueOnce(vi.fn());
  const { unmount } = render(<BarcodeScanner onSave={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Start camera' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('enter the barcode below');
  expect(screen.getByLabelText('Barcode number')).toBeEnabled();
  expect(screen.queryByText('private device')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  const signal = openBarcodeCamera.mock.calls[1][2].signal;
  await user.click(screen.getByRole('button', { name: 'Stop camera' }));
  expect(signal.aborted).toBe(true);
  expect(screen.queryByRole('button', { name: 'Stop camera' })).not.toBeInTheDocument();
  unmount();
});
it('aborts late camera grants and pending lookups when leaving', async () => {
  const user = userEvent.setup();
  openBarcodeCamera.mockReturnValue(new Promise(() => {}));
  let view = render(<BarcodeScanner onSave={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Start camera' }));
  const signal = openBarcodeCamera.mock.calls[0][2].signal;
  view.unmount();
  expect(signal.aborted).toBe(true);
  lookupBarcode.mockReturnValue(new Promise(() => {}));
  view = render(<BarcodeScanner onSave={vi.fn()} />);
  await user.type(screen.getByLabelText('Barcode number'), '030000010204{Enter}');
  const lookupSignal = lookupBarcode.mock.calls[0][1].signal;
  view.unmount();
  expect(lookupSignal.aborted).toBe(true);
});
it('returns to the actual matching serving choices with the scan-specific back action', async () => {
  const user = userEvent.setup();
  lookupBarcode.mockResolvedValue(found);
  render(<BarcodeScanner onSave={vi.fn()} />);
  await user.type(screen.getByLabelText('Barcode number'), '030000010204{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Back to barcode results' }));
  expect(screen.getByRole('region', { name: 'Matching food servings' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: `Choose ${food.name}` }));
  expect(screen.getByRole('heading', { name: 'Choose serving and meal' })).toBeVisible();
});
