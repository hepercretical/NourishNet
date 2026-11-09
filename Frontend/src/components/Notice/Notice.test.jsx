import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Notice from './Notice.jsx';
it('announces an opted-in success message with its explanation', () => {
  render(
    <Notice title="Preview ready" tone="success" announce>
      <p>Your choices are kept.</p>
    </Notice>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Preview ready');
  expect(screen.getByRole('status')).toHaveTextContent('Your choices are kept.');
});
it('keeps informational content visible without an unsolicited announcement', () => {
  render(<Notice title="About this food">Review its serving basis.</Notice>);
  expect(screen.getByText('About this food')).toBeVisible();
  expect(screen.getByText('Review its serving basis.')).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
