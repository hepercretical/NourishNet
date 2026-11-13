import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivatePhoto from './PrivatePhoto.jsx';
import { loadPrivatePhoto } from '../../services/privatePhotos.js';
vi.mock('../../services/hostedConfig.js', () => ({ usesNeonAuth: true }));
vi.mock('../../services/privatePhotos.js', () => ({ loadPrivatePhoto: vi.fn() }));
beforeEach(() => {
  cleanup();
  vi.resetAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:private-test');
  URL.revokeObjectURL = vi.fn();
});
it('loads an owned photo, shows an accessible image and releases its private object URL', async () => {
  let resolve;
  loadPrivatePhoto.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const view = render(
    <PrivatePhoto src="/api/submissions/test/photos/front" alt="Package front" />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Loading package front');
  resolve(new Blob(['image']));
  expect(await screen.findByRole('img', { name: 'Package front' })).toHaveAttribute(
    'src',
    'blob:private-test',
  );
  const signal = loadPrivatePhoto.mock.calls[0][1].signal;
  view.unmount();
  expect(signal.aborted).toBe(true);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-test');
});
it('keeps private diagnostics hidden and retries a failed photo', async () => {
  loadPrivatePhoto
    .mockRejectedValueOnce(new Error('private detail'))
    .mockResolvedValue(new Blob(['image']));
  render(<PrivatePhoto src="/api/submissions/test/photos/label" alt="Nutrition label" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Nutrition label could not be loaded');
  expect(screen.queryByText('private detail')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Retry nutrition label' }));
  expect(await screen.findByRole('img')).toHaveAttribute('src', 'blob:private-test');
});
it('aborts an obsolete photo without creating a late object URL', async () => {
  let resolve;
  loadPrivatePhoto.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const view = render(
    <PrivatePhoto src="/api/submissions/test/photos/front" alt="Package front" />,
  );
  view.unmount();
  resolve(new Blob(['image']));
  await waitFor(() => expect(loadPrivatePhoto.mock.calls[0][1].signal.aborted).toBe(true));
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
