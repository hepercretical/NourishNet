import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Button from '../Button/Button.jsx';

it('keeps disabled and pending buttons out of keyboard action order', async () => {
  const user = userEvent.setup();
  const click = vi.fn();
  render(
    <>
      <Button disabled onClick={click}>
        Unavailable
      </Button>
      <Button pending pendingLabel="Saving…" onClick={click}>
        Save
      </Button>
      <Button>Next action</Button>
    </>,
  );
  await user.tab();
  expect(screen.getByRole('button', { name: 'Next action' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true');
  await user.click(screen.getByRole('button', { name: 'Saving…' }));
  expect(click).not.toHaveBeenCalled();
});
