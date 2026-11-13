import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import DailySummary from './DailySummary.jsx';
const diary = {
  date: '2026-11-12',
  timeZone: 'America/Denver',
  totals: { calories: 170, protein: 10, carbohydrates: 10, fat: 10, sodium: null },
  goal: {
    calories: 2000,
    macroMode: 'percent',
    macros: { protein: 30, carbohydrates: 50, fat: 20 },
  },
};
it('shows real daily totals, macro energy proportions and saved goal units', () => {
  render(<DailySummary diary={diary} />);
  expect(
    within(screen.getByRole('region', { name: 'Daily nutrition facts' })).getByText('170 kcal'),
  ).toBeVisible();
  expect(screen.getByRole('img', { name: /Macro calorie/ })).toBeVisible();
  expect(screen.getByText('52.94%')).toBeVisible();
  expect(screen.getByText('30% (150.00 g)')).toBeVisible();
  expect(screen.getByText('Not provided')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Back to this diary day' })).toHaveAttribute(
    'href',
    '#/app/dashboard',
  );
});
it.each([null, 0])('shows an honest empty or unknown chart when fat is %s', (fat) => {
  render(
    <DailySummary
      diary={{ ...diary, goal: null, totals: { protein: 0, carbohydrates: 0, fat } }}
    />,
  );
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getAllByText('Not set')).toHaveLength(3);
});
