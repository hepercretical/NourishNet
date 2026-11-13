import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import CalorieProgress from './CalorieProgress.jsx';
it('shows real remaining and over-target values while bounding only the bar', () => {
  const { rerender } = render(
    <CalorieProgress calories={1500} goal={{ calories: 2000, mode: 'maintain' }} />,
  );
  expect(screen.getByText('500 kcal remaining to target')).toBeVisible();
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1500');
  rerender(<CalorieProgress calories={2300} goal={{ calories: 2000, mode: 'surplus' }} />);
  expect(screen.getByText('300 kcal over target')).toBeVisible();
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '2000');
});
it('never fabricates a goal or unknown progress', () => {
  const { rerender } = render(<CalorieProgress calories={50} />);
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Set a calorie target' })).toHaveAttribute(
    'href',
    '#/app/settings/goals',
  );
  rerender(<CalorieProgress calories={null} goal={{ calories: 2000 }} />);
  expect(screen.getByText(/progress is unavailable/)).toBeVisible();
});
