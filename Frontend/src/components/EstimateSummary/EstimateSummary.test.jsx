import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { estimateNotice } from '../../design/screens.js';
import EstimateSummary from '../EstimateSummary/EstimateSummary.jsx';
import Notice from '../Notice/Notice.jsx';
import PendingStatus from '../PendingStatus/PendingStatus.jsx';

it('keeps the mathematical estimate notice alongside supplied values and assumptions', () => {
  render(
    <EstimateSummary
      values={{ calories: 2000 }}
      explanation="Synthetic display fixture. Formula version and assumptions supplied by the caller."
      effectiveDate="November 9, 2026"
    />,
  );
  const estimate = screen.getByRole('region', { name: 'Goal estimate' });
  expect(within(estimate).getByText(estimateNotice)).toBeVisible();
  expect(within(estimate).getByText('2000 kcal')).toBeVisible();
  expect(within(estimate).getByText(/Formula version and assumptions/)).toBeVisible();
  expect(within(estimate).getByText('Effective date: November 9, 2026')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('shows no invented estimate and supports pending and success notices', () => {
  render(
    <>
      <EstimateSummary />
      <PendingStatus />
      <Notice title="Preview confirmed" tone="success" announce>
        <p>Your preview is ready.</p>
      </Notice>
    </>,
  );
  expect(screen.getByText(/Calories: Not calculated/)).toBeVisible();
  expect(screen.getByText(/await human and qualified review/)).toBeVisible();
  expect(screen.getAllByRole('status')).toHaveLength(2);
  expect(screen.getByText('Your preview is ready.')).toBeVisible();
});
