import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AccountForm from './AccountForm.jsx';

it('opens a guest diary by keyboard without requiring sign-in fields and prevents repeat requests', async () => {
  const user = userEvent.setup();
  let reject;
  const guest = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((_yes, no) => {
          reject = no;
        }),
    )
    .mockResolvedValueOnce({});
  render(<AccountForm mode="login" onSubmit={vi.fn()} onGuest={guest} />);
  const button = screen.getByRole('button', { name: 'Continue as guest' });
  button.focus();
  await user.keyboard('{Enter}');
  expect(guest).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
  await user.click(button);
  expect(guest).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('Guest testing could not start. Try again.')));
  expect(screen.getByRole('alert')).toHaveTextContent('Try again');
  await user.click(button);
  expect(guest).toHaveBeenCalledTimes(2);
});

it.each([{ mode: 'signup' }, { mode: 'login' }])(
  'keeps guest testing out of unrelated or hosted forms: %j',
  (props) => {
    render(
      <AccountForm
        onSubmit={vi.fn()}
        {...(props.mode === 'signup' || props.hosted ? { onGuest: vi.fn() } : {})}
        {...props}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Continue as guest' })).not.toBeInTheDocument();
  },
);

it('offers the temporary guest option beside sign in in hosted builds', async () => {
  const guest = vi.fn().mockResolvedValue({});
  const user = userEvent.setup();
  render(<AccountForm mode="login" hosted onSubmit={vi.fn()} onGuest={guest} />);
  expect(screen.getByRole('button', { name: 'Sign in' }).parentElement).toBe(
    screen.getByRole('button', { name: 'Continue as guest' }).parentElement,
  );
  await user.click(screen.getByRole('button', { name: 'Continue as guest' }));
  expect(guest).toHaveBeenCalledOnce();
});

it('accepts a six-digit hosted verification code and explains mailbox delivery', async () => {
  const user = userEvent.setup();
  const submit = vi.fn().mockResolvedValue({});
  render(
    <AccountForm
      mode="verify"
      hosted
      initialEmail="tester@example.test"
      onSubmit={submit}
      onResend={vi.fn()}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: 'One-time code' }), '123456');
  await user.click(screen.getByRole('button', { name: 'Verify account' }));
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ code: '123456' }));
  expect(screen.getByRole('textbox', { name: 'Test email' })).toHaveAccessibleDescription(
    /Neon sends/,
  );
});

it('requires adult confirmation for hosted profile onboarding without collecting another password', async () => {
  const user = userEvent.setup();
  const submit = vi.fn().mockResolvedValue({});
  render(<AccountForm mode="profile" hosted onSubmit={submit} />);
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Test email' })).not.toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Fictional display name' }), 'Fiction');
  await user.click(screen.getByRole('button', { name: 'Complete account setup' }));
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole('checkbox', { name: 'I am 18 or older' }));
  await user.click(screen.getByRole('button', { name: 'Complete account setup' }));
  expect(submit).toHaveBeenCalledWith(
    expect.objectContaining({ adult: true, displayName: 'Fiction' }),
  );
});

it('labels signup fields, requires adulthood and keeps invalid input beside its error', async () => {
  const user = userEvent.setup(),
    submit = vi.fn();
  render(<AccountForm mode="signup" onSubmit={submit} />);
  await user.type(screen.getByRole('textbox', { name: 'Fictional email' }), 'real@example.com');
  await user.click(screen.getByRole('button', { name: 'Create fictional account' }));
  expect(screen.getByRole('textbox', { name: 'Fictional email' })).toHaveAccessibleDescription(
    /ending in .test or .invalid/,
  );
  expect(screen.getByRole('checkbox', { name: 'I am 18 or older' })).not.toBeChecked();
  expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(/adults aged 18/);
  expect(screen.getByRole('textbox', { name: 'Fictional email' })).toHaveValue('real@example.com');
  expect(submit).not.toHaveBeenCalled();
});
it('submits normalized synthetic signup data with a test-only password and timezone', async () => {
  const user = userEvent.setup(),
    submit = vi.fn().mockResolvedValue({ message: 'Check your local outbox.' });
  render(<AccountForm mode="signup" onSubmit={submit} />);
  await user.type(screen.getByRole('textbox', { name: 'Fictional email' }), 'Avery@example.test');
  await user.type(screen.getByRole('textbox', { name: 'Fictional display name' }), 'Avery Fiction');
  await user.type(screen.getByLabelText('Password'), 'fictional-only-password');
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Create fictional account' }));
  expect(submit).toHaveBeenCalledWith(
    expect.objectContaining({
      email: 'avery@example.test',
      adult: true,
      timeZone: 'America/Denver',
      password: 'fictional-only-password',
    }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Check your local outbox.');
});
it('prevents duplicate pending sign-in, preserves input after failure and retries', async () => {
  const user = userEvent.setup();
  let reject;
  const submit = vi
    .fn()
    .mockReturnValueOnce(
      new Promise((_resolve, no) => {
        reject = no;
      }),
    )
    .mockResolvedValueOnce({});
  render(<AccountForm mode="login" initialEmail="avery@example.test" onSubmit={submit} />);
  await user.type(screen.getByLabelText('Password'), 'fictional-only-password');
  await user.dblClick(screen.getByRole('button', { name: 'Sign in' }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
  await act(async () => reject(new Error('Sign in could not complete. Try again.')));
  expect(screen.getByRole('alert')).toHaveTextContent('Try again');
  expect(screen.getByRole('textbox', { name: 'Fictional email' })).toHaveValue(
    'avery@example.test',
  );
  expect(screen.getByLabelText('Password')).toHaveValue('fictional-only-password');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(submit).toHaveBeenCalledTimes(2);
});
it.each(['verify', 'reset'])('accepts a copied one-time code for %s', async (mode) => {
  const user = userEvent.setup(),
    submit = vi.fn().mockResolvedValue({});
  render(
    <AccountForm
      mode={mode}
      initialEmail="avery@example.test"
      onSubmit={submit}
      onResend={vi.fn()}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: 'One-time code' }), 'a'.repeat(43));
  if (mode === 'reset')
    await user.type(screen.getByLabelText('New password'), 'replacement-test-password');
  await user.click(
    screen.getByRole('button', { name: mode === 'verify' ? 'Verify account' : 'Reset password' }),
  );
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ code: 'a'.repeat(43) }));
});
it('requests recovery without collecting a password and supports resending verification', async () => {
  const user = userEvent.setup(),
    submit = vi.fn().mockResolvedValue({}),
    resend = vi.fn().mockResolvedValue({ message: 'A new code is in the local outbox.' });
  const { rerender } = render(
    <AccountForm mode="recover" initialEmail="avery@example.test" onSubmit={submit} />,
  );
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Request recovery code' }));
  expect(submit).toHaveBeenCalledTimes(1);
  rerender(
    <AccountForm
      mode="verify"
      initialEmail="avery@example.test"
      onSubmit={submit}
      onResend={resend}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Request a new code' }));
  expect(resend).toHaveBeenCalledWith({ email: 'avery@example.test' });
  expect(screen.getByRole('status')).toHaveTextContent('A new code');
});
