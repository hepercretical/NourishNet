import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ProductPhoto from './ProductPhoto.jsx';
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test-photo');
  URL.revokeObjectURL = vi.fn();
});

it('shows an owned existing photo and offers replacement without a destructive remove action', () => {
  render(
    <ProductPhoto
      kind="front"
      title="Package front photo"
      file={null}
      onChange={vi.fn()}
      existingUrl="/api/submissions/record/photos/front"
    />,
  );
  expect(screen.getByAltText('Package front photo current upload')).toHaveAttribute(
    'src',
    '/api/submissions/record/photos/front',
  );
  expect(screen.getByLabelText('Replace package front photo')).toBeEnabled();
  expect(
    screen.queryByRole('button', { name: 'Remove package front photo' }),
  ).not.toBeInTheDocument();
});
it('selects, previews, replaces and removes an image and revokes each preview', async () => {
  const user = userEvent.setup(),
    change = vi.fn(),
    front = new File(['image'], 'front.jpg', { type: 'image/jpeg' });
  const props = { kind: 'front', title: 'Package front photo', onChange: change };
  const view = render(<ProductPhoto {...props} file={null} />);
  await user.upload(screen.getByLabelText('Choose package front photo'), front);
  expect(change).toHaveBeenLastCalledWith(front);
  view.rerender(<ProductPhoto {...props} file={front} />);
  expect(screen.getByAltText('Package front photo preview')).toHaveAttribute(
    'src',
    'blob:test-photo',
  );
  const next = new File(['replacement'], 'replacement.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText('Replace package front photo'), next);
  expect(change).toHaveBeenLastCalledWith(next);
  view.rerender(<ProductPhoto {...props} file={next} />);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-photo');
  await user.click(screen.getByRole('button', { name: 'Remove package front photo' }));
  expect(change).toHaveBeenLastCalledWith(null);
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});
it('rejects wrong types and oversized files without discarding an existing choice, and disables controls while pending', async () => {
  const user = userEvent.setup({ applyAccept: false }),
    change = vi.fn(),
    file = new File(['image'], 'label.jpg', { type: 'image/jpeg' });
  const view = render(
    <ProductPhoto kind="label" title="Nutrition label photo" file={file} onChange={change} />,
  );
  await user.upload(
    screen.getByLabelText('Replace nutrition label photo'),
    new File(['bad'], 'label.svg', { type: 'image/svg+xml' }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Use a JPEG, PNG or WebP');
  expect(change).not.toHaveBeenCalled();
  const large = new File(['bytes'], 'large.jpg', { type: 'image/jpeg' });
  Object.defineProperty(large, 'size', { value: 6 * 1024 * 1024 });
  await user.upload(screen.getByLabelText('Replace nutrition label photo'), large);
  expect(screen.getByRole('alert')).toHaveTextContent('5 MB');
  view.rerender(
    <ProductPhoto
      kind="label"
      title="Nutrition label photo"
      file={file}
      onChange={change}
      disabled
    />,
  );
  expect(screen.getByLabelText('Replace nutrition label photo')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove nutrition label photo' })).toBeDisabled();
});
