import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard.jsx';
import responsiveStyles from './Dashboard.css?raw';

const account = { id: 'avery', displayName: 'Avery Fiction' };
const diary = {
  date: '2026-11-09',
  timeZone: 'America/Denver',
  totals: { calories: 0, protein: 0, fat: 0, carbohydrates: 0, sodium: 0 },
  meals: ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((name) => ({ name, entries: [] })),
};
it('moves summary focus on request and omits unfinished tracking filler', async () => {
  const user = userEvent.setup();
  render(<Dashboard account={account} diary={diary} />);
  await user.click(screen.getByRole('button', { name: 'View daily summary' }));
  expect(screen.getByRole('region', { name: 'Recorded daily nutrition' })).toHaveFocus();
  expect(
    screen.queryByRole('region', { name: 'Additional tracking options' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Exercise|Weigh-in|Water|Not included in Sprint 1/),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Add food to breakfast' })).toHaveTextContent('＋');
});
it('shows five nutrient totals, private status, all four meals and useful empty recovery links', () => {
  render(<Dashboard account={account} diary={diary} />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your daily diary');
  expect(screen.getByText(/Your diary is private. Sharing is off/)).toBeVisible();
  const summary = screen.getByRole('region', { name: 'Recorded daily nutrition' });
  expect(
    within(summary)
      .getAllByRole('term')
      .map((term) => term.textContent),
  ).toEqual(['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Sodium']);
  expect(within(summary).getByText('0 kcal')).toBeVisible();
  expect(within(summary).getByText('0 mg')).toBeVisible();
  for (const name of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
    const meal = screen.getByRole('region', { name });
    expect(within(meal).getByRole('heading', { level: 2, name })).toBeVisible();
    expect(within(meal).getByText(/No food recorded/)).toBeVisible();
    expect(
      within(meal).getByRole('link', { name: `Add food to ${name.toLowerCase()}` }),
    ).toHaveAttribute('href', `#/app/search/${name}`);
  }
});
it('shows supplied long food names, serving basis, decimals and unknown sodium in the correct meal', () => {
  const name =
    'Sample lentil and roasted vegetable bowl with herb dressing and a deliberately long package description';
  render(
    <Dashboard
      account={account}
      diary={{
        ...diary,
        totals: { calories: 320, protein: 18, fat: 8, carbohydrates: 44, sodium: null },
        meals: [
          {
            name: 'Lunch',
            entries: [
              {
                id: 'entry',
                name,
                servingBasis: '1.5 sample bowls',
                nutrients: {
                  calories: 320,
                  protein: 18.5,
                  fat: 8,
                  carbohydrates: 44,
                  sodium: null,
                },
              },
            ],
          },
        ],
      }}
    />,
  );
  const lunch = screen.getByRole('region', { name: 'Lunch' });
  expect(within(lunch).getByRole('article', { name })).toBeVisible();
  expect(within(lunch).getByText('Per serving: 1.5 sample bowls')).toBeVisible();
  expect(within(lunch).getByText('18.5 g')).toBeVisible();
  expect(within(lunch).getByText('Not provided')).toBeVisible();
});
it('hides diary values while loading or failed and offers persistent keyboard retry', async () => {
  const retry = vi.fn(),
    user = userEvent.setup();
  const { rerender } = render(<Dashboard account={account} diary={diary} loading />);
  expect(screen.getByRole('status')).toHaveTextContent('Previous account data stays hidden');
  expect(screen.queryByText('0 kcal')).not.toBeInTheDocument();
  rerender(<Dashboard account={account} diary={diary} error onRetry={retry} />);
  expect(screen.getByRole('alert')).toBeVisible();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('alert')).toBeVisible();
});
it('allows meal and long-content reflow on phones and adds columns only when space is available', () => {
  // JSDOM cannot lay out pixels; this guards the responsive contract, with visual review at handoff.
  expect(responsiveStyles).toMatch(/\.dashboard-meals\s*\{[^}]*display:\s*grid;[^}]*gap:/);
  expect(responsiveStyles).toMatch(/@media\s*\(min-width:\s*40rem\)/);
  expect(responsiveStyles).toContain('repeat(2, minmax(0, 1fr))');
  expect(responsiveStyles).toContain('overflow-wrap: anywhere');
  expect(responsiveStyles).not.toMatch(/(?:min-)?width:\s*\d{3,}px/);
});

it('shows persisted lowercase meals, scaled snapshot contributions and consistently rounded server totals', () => {
  render(
    <Dashboard
      account={account}
      diary={{
        ...diary,
        totals: { calories: 225.12345, sodium: null },
        meals: [
          {
            name: 'lunch',
            entries: [
              {
                id: 'saved',
                foodName: 'Saved oats',
                quantity: 1.5,
                servingBasis: '40 g',
                nutrients: { calories: 150 },
                contribution: { calories: 225.12345, protein: 7.5, sodium: null },
              },
            ],
          },
        ],
      }}
    />,
  );
  const lunch = screen.getByRole('region', { name: 'Lunch' });
  expect(within(lunch).getByRole('article', { name: 'Saved oats' })).toBeVisible();
  expect(within(lunch).getByText('Logged amount: 1.5 servings \u00d7 40 g')).toBeVisible();
  expect(within(lunch).getByText('225.12 kcal')).toBeVisible();
  expect(within(lunch).queryByText('150 kcal')).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('region', { name: 'Recorded daily nutrition' })).getByText(
      '225.12 kcal',
    ),
  ).toBeVisible();
  expect(within(lunch).getByRole('link', { name: 'Add food to lunch' })).toHaveAttribute(
    'href',
    '#/app/search/Lunch',
  );
});
