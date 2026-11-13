import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import Submissions from './Submissions.jsx';
import { listSubmissions, getSubmission } from '../../services/submissions.js';
vi.mock('../../services/submissions.js', () => ({
  listSubmissions: vi.fn(),
  getSubmission: vi.fn(),
  submitProduct: vi.fn(),
}));
const record = {
  id: 'record',
  barcode: '00030000010402',
  productName: 'Quaker Old Fashioned Oats 42 oz',
  servingBasis: '',
  nutrients: { calories: null, protein: null, fat: null, carbohydrates: null, sodium: null },
  status: 'pending',
  revision: 1,
  photos: { front: '/api/front', label: '/api/label' },
  reviewNote: '',
};
beforeEach(() => vi.resetAllMocks());
it('shows real loading, failure/retry, empty and then owned status rows', async () => {
  const user = userEvent.setup();
  let resolve;
  listSubmissions
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    )
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([record]);
  render(<Submissions />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading your submissions');
  await act(async () => resolve(Promise.reject(new Error('offline'))));
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No submissions yet')).toBeVisible();
  // Re-entering the list performs a fresh owned read, not a fabricated status.
  const other = render(<Submissions />);
  expect(await screen.findByRole('link', { name: record.productName })).toHaveAttribute(
    'href',
    '#/app/submissions/record',
  );
  expect(screen.getByText('Pending review')).toBeVisible();
  other.unmount();
});
it.each([
  ['pending', 'Pending review'],
  ['needs-review', 'Changes requested'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
])('renders %s status and only exposes correction when requested', async (status, label) => {
  getSubmission.mockResolvedValue({ ...record, status, reviewNote: 'Check the nutrition label.' });
  render(<Submissions id="record" />);
  expect(await screen.findByText(label)).toBeVisible();
  expect(screen.getByText('Check the nutrition label.')).toBeVisible();
  expect(screen.getByAltText('Submitted nutrition label')).toHaveAttribute('src', '/api/label');
  if (status === 'needs-review')
    expect(screen.getByRole('button', { name: 'Correct requested fields' })).toBeEnabled();
  else
    expect(
      screen.queryByRole('button', { name: 'Correct requested fields' }),
    ).not.toBeInTheDocument();
});
it('clears pending reads on leaving and opens the requested correction form', async () => {
  const user = userEvent.setup();
  getSubmission.mockResolvedValue({ ...record, status: 'needs-review' });
  const view = render(<Submissions id="record" />);
  await user.click(await screen.findByRole('button', { name: 'Correct requested fields' }));
  expect(screen.getByRole('heading', { name: 'Correct your product submission' })).toBeVisible();
  view.unmount();
  expect(getSubmission.mock.calls[0][1].signal.aborted).toBe(true);
});
