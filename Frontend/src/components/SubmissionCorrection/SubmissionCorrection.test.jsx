import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import SubmissionCorrection from './SubmissionCorrection.jsx';
import { submitProduct } from '../../services/submissions.js';
vi.mock('../../services/submissions.js', () => ({ submitProduct: vi.fn() }));
it('corrects requested metadata with existing photos, a locked barcode, and the same retry key', async () => {
  const user = userEvent.setup(),
    done = vi.fn(),
    cancel = vi.fn();
  const submission = {
    id: 'record',
    barcode: '00030000010402',
    revision: 3,
    productName: 'Quaker oats',
    servingBasis: '',
    nutrients: { calories: null, protein: null, fat: null, carbohydrates: null, sodium: null },
    photos: { front: '/api/front', label: '/api/label' },
  };
  submitProduct
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ id: 'record', status: 'pending' });
  render(<SubmissionCorrection submission={submission} onSaved={done} onCancel={cancel} />);
  expect(screen.getByLabelText('Barcode number')).toHaveAttribute('readonly');
  expect(screen.getByAltText('Package front photo current upload')).toHaveAttribute(
    'src',
    '/api/front',
  );
  await user.type(screen.getByLabelText('Product name (optional)'), ' 42 oz');
  await user.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your choices are kept');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(submitProduct.mock.calls[1][1].requestKey).toBe(submitProduct.mock.calls[0][1].requestKey);
  expect(submitProduct.mock.calls[1][1]).toMatchObject({ id: 'record', revision: 3 });
  expect(done).toHaveBeenCalledWith({ id: 'record', status: 'pending' });
  await user.click(screen.getByRole('button', { name: 'Back to scan' }));
  expect(cancel).toHaveBeenCalledOnce();
});
