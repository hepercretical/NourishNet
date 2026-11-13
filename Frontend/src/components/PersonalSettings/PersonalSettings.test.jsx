import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import PersonalSettings from './PersonalSettings.jsx';
import { accountRequest } from '../../services/accounts.js';
vi.mock('../../services/accounts.js', () => ({ accountRequest: vi.fn() }));
const account = { id: 'owner', displayName: 'Avery', timeZone: 'America/Denver' };
beforeEach(() => {
  accountRequest.mockReset();
});
it('edits real profile fields and validates a time zone before saving', async () => {
  accountRequest.mockResolvedValue({ saved: true });
  const user = userEvent.setup();
  render(<PersonalSettings page="profile" account={account} />);
  expect(screen.getByLabelText('Display name')).toHaveValue('Avery');
  await user.clear(screen.getByLabelText('Diary time zone'));
  await user.type(screen.getByLabelText('Diary time zone'), 'bad-zone');
  await user.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(screen.getByRole('alert')).toHaveTextContent('valid time zone');
  expect(accountRequest).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Diary time zone'));
  await user.type(screen.getByLabelText('Diary time zone'), 'UTC');
  await user.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Profile saved');
  expect(accountRequest).toHaveBeenCalledWith(
    '/personal/profile',
    expect.objectContaining({
      method: 'PATCH',
      body: expect.objectContaining({ timeZone: 'UTC', previousTimeZone: account.timeZone }),
    }),
  );
});
it('loads and saves an explicit theme/accent then reports success', async () => {
  accountRequest.mockImplementation(async (_path, options) =>
    options?.method === 'PUT'
      ? { mode: 'dark', accent: 'purple', revision: 1 }
      : { mode: 'light', accent: 'green', revision: 0 },
  );
  const changed = vi.fn();
  window.addEventListener('nourishnet:appearance', changed);
  const user = userEvent.setup();
  render(<PersonalSettings page="appearance" account={account} />);
  await user.selectOptions(await screen.findByLabelText('Theme'), 'dark');
  await user.selectOptions(screen.getByLabelText('Main color'), 'purple');
  await user.click(screen.getByRole('button', { name: 'Save appearance' }));
  expect(await screen.findByText('Appearance saved.')).toBeVisible();
  expect(changed).toHaveBeenCalledOnce();
  window.removeEventListener('nourishnet:appearance', changed);
  expect(accountRequest).toHaveBeenCalledWith(
    '/personal/appearance',
    expect.objectContaining({
      method: 'PUT',
      body: expect.objectContaining({ mode: 'dark', accent: 'purple', revision: 0 }),
    }),
  );
});
it('requires a matching password, sends no retry key with passwords and clears fields after success', async () => {
  accountRequest.mockResolvedValue({ saved: true });
  const user = userEvent.setup();
  render(<PersonalSettings page="password" account={account} />);
  await user.type(screen.getByLabelText('Current password'), 'fictional-old-password');
  await user.type(screen.getByLabelText('New password'), 'fictional-new-password');
  await user.click(screen.getByRole('button', { name: 'Change password' }));
  expect(screen.getByRole('alert')).toHaveTextContent('matching confirmation');
  await user.type(screen.getByLabelText('Confirm new password'), 'fictional-new-password');
  await user.click(screen.getByRole('button', { name: 'Change password' }));
  await waitFor(() => expect(screen.getByLabelText('Current password')).toHaveValue(''));
  expect(accountRequest.mock.calls[0][1].body).toEqual({
    currentPassword: 'fictional-old-password',
    newPassword: 'fictional-new-password',
  });
});
it('shows actual notification status links or an actionable empty state', async () => {
  accountRequest.mockResolvedValue({ submissions: [] });
  const view = render(<PersonalSettings page="notifications" account={account} />);
  expect(
    await screen.findByRole('link', { name: 'Track food or submit an unknown product' }),
  ).toHaveAttribute('href', '#/app/track');
  view.unmount();
  accountRequest.mockResolvedValue({
    submissions: [
      {
        id: 'record',
        productName: 'Actual test package',
        createdAt: '2026-11-12T00:00:00Z',
        status: 'needs-review',
        reviewNote: 'Replace the label photo',
      },
    ],
  });
  render(<PersonalSettings page="notifications" account={account} />);
  expect(await screen.findByRole('link', { name: /Actual test package/ })).toHaveAttribute(
    'href',
    '#/app/submissions/record',
  );
  expect(screen.getByText('Replace the label photo')).toBeVisible();
});
it('shows persistent recovery after appearance loading fails', async () => {
  accountRequest.mockRejectedValue(new Error('private diagnostics'));
  render(<PersonalSettings page="appearance" account={account} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(screen.queryByText('private diagnostics')).not.toBeInTheDocument();
});
