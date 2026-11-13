import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ProductSubmission from './ProductSubmission.jsx';
import { emptySubmission } from '../../utils/submissionDraft.js';
function Form({ submit = vi.fn(), done = vi.fn(), back = vi.fn() }) {
  const [draft, setDraft] = useState(emptySubmission('030000010204'));
  return (
    <ProductSubmission
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={submit}
      onSubmitted={done}
      onBack={back}
    />
  );
}
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
async function photos(user) {
  await user.upload(
    screen.getByLabelText('Choose package front photo'),
    new File(['front'], 'front.jpg', { type: 'image/jpeg' }),
  );
  await user.upload(
    screen.getByLabelText('Choose nutrition label photo'),
    new File(['label'], 'label.png', { type: 'image/png' }),
  );
}
it('requires both photos with clear associated errors and does not require label transcription', async () => {
  const user = userEvent.setup(),
    submit = vi.fn().mockResolvedValue({ id: 'submission' }),
    done = vi.fn();
  render(<Form submit={submit} done={done} />);
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  expect(submit).not.toHaveBeenCalled();
  await photos(user);
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(submit).toHaveBeenCalledOnce();
  expect(submit.mock.calls[0][0]).toMatchObject({
    barcode: '030000010204',
    productName: '',
    nutrients: { calories: '', sodium: '' },
  });
  expect(done).toHaveBeenCalledWith({ id: 'submission' });
  expect(screen.getByText(/they are not searchable catalog food/)).toBeVisible();
});
it('validates optional fields, preserves choices on failure, and retries once with controls pending', async () => {
  const user = userEvent.setup(),
    done = vi.fn();
  let finish;
  const submit = vi
    .fn()
    .mockRejectedValueOnce(new Error('private filesystem'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  render(<Form submit={submit} done={done} />);
  await photos(user);
  await user.click(screen.getByText('Add label details (optional)'));
  await user.type(screen.getByLabelText('Calories (kcal) (optional)'), '-1');
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(screen.getByRole('alert')).toHaveTextContent('nonnegative');
  await user.clear(screen.getByLabelText('Calories (kcal) (optional)'));
  await user.type(screen.getByLabelText('Product name (optional)'), 'Quaker oats');
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your choices are kept');
  expect(screen.queryByText('private filesystem')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Product name (optional)')).toHaveValue('Quaker oats');
  expect(screen.getByAltText('Package front photo preview')).toBeVisible();
  await user.dblClick(screen.getByRole('button', { name: 'Try again' }));
  expect(submit).toHaveBeenCalledTimes(2);
  expect(submit.mock.calls[1][0]).toEqual(submit.mock.calls[0][0]);
  expect(screen.getByRole('button', { name: 'Submitting photos…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Back to scan' })).toBeDisabled();
  await act(async () => finish({ id: 'submission' }));
  expect(done).toHaveBeenCalledOnce();
});
it('lets the owning flow preserve the draft when returning to scan and validates edited barcode', async () => {
  const user = userEvent.setup(),
    back = vi.fn(),
    submit = vi.fn();
  render(<Form back={back} submit={submit} />);
  await user.clear(screen.getByLabelText('Barcode number'));
  await user.type(screen.getByLabelText('Barcode number'), 'letters');
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(screen.getByText('Enter all 8, 12, 13 or 14 barcode digits.')).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Back to scan' }));
  expect(back).toHaveBeenCalledOnce();
});
