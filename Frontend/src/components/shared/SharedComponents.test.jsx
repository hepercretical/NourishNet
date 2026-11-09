import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePendingAction } from '../../hooks/usePendingAction.js';
import { estimateNotice } from '../../design/screens.js';
import {
  Button,
  EmptyState,
  ErrorState,
  EstimateSummary,
  FoodCard,
  FormField,
  LoadingState,
  MealSelect,
  Notice,
  PendingStatus,
  SearchForm,
  ServingMealForm,
} from './index.js';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function SearchHarness({ onSearch }) {
  const [query, setQuery] = useState('');
  return <SearchForm query={query} onQueryChange={setQuery} onSearch={onSearch} />;
}

function ServingHarness({ onSubmit, initial = { amount: '1.5', meal: 'Breakfast' } }) {
  const [draft, setDraft] = useState(initial);
  return (
    <ServingMealForm
      draft={draft}
      onDraftChange={setDraft}
      servingBasis="40 g dry"
      onSubmit={onSubmit}
    />
  );
}

describe('shared search controls', () => {
  it('focuses a visible field error for an empty search and searches with Enter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchHarness onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Search foods' });
    await user.tab();
    expect(input).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Enter a food name/);
    expect(onSearch).not.toHaveBeenCalled();
    await user.type(input, '  rolled oats  {Enter}');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('rolled oats');
    expect(input).toHaveValue('  rolled oats  ');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('keeps the query through pending, failure and retry without exposing service errors', async () => {
    const user = userEvent.setup();
    const request = deferred();
    const onSearch = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValueOnce([]);
    render(<SearchHarness onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Search foods' });
    await user.type(input, 'oats');
    await user.dblClick(screen.getByRole('button', { name: 'Search foods' }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled();
    expect(screen.getByRole('form', { name: 'Food search' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Your search text is kept');
    await act(async () => request.reject(new Error('SQL secret diagnostic')));
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be searched/);
    expect(screen.queryByText(/SQL secret/)).not.toBeInTheDocument();
    expect(input).toHaveValue('oats');
    expect(input).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onSearch).toHaveBeenCalledTimes(2);
    expect(onSearch).toHaveBeenLastCalledWith('oats');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveValue('oats');
  });
});

describe('shared serving and meal controls', () => {
  it.each(['', '0', '-1', 'NaN', 'Infinity', '1e3', '1,5', '1.2.3', '   '])(
    'keeps invalid serving %j beside its field',
    async (amount) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ServingHarness onSubmit={onSubmit} initial={{ amount, meal: 'Lunch' }} />);
      await user.click(screen.getByRole('button', { name: 'Continue' }));
      const input = screen.getByRole('textbox', { name: 'Serving amount' });
      expect(input).toHaveValue(amount);
      expect(input).toHaveAccessibleDescription(/greater than zero/);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Lunch');
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it('focuses invalid fields, accepts decimal servings and every meal using native controls', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ServingHarness onSubmit={onSubmit} initial={{ amount: '', meal: '' }} />);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const input = screen.getByRole('textbox', { name: 'Serving amount' });
    await vi.waitFor(() => expect(input).toHaveFocus());
    expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveAccessibleDescription(
      /Choose Breakfast/,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    await user.type(input, '.5');
    await user.tab();
    const meals = screen.getByRole('combobox', { name: 'Meal' });
    expect(meals).toHaveFocus();
    expect(
      within(meals)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Choose a meal', 'Breakfast', 'Lunch', 'Dinner', 'Snack']);
    for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
      await user.selectOptions(meals, meal);
      await user.click(screen.getByRole('button', { name: 'Continue' }));
      expect(onSubmit).toHaveBeenLastCalledWith({ amount: 0.5, meal });
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves decimal amount and meal after failure and submits once while pending', async () => {
    const user = userEvent.setup();
    const request = deferred();
    const onSubmit = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValueOnce(undefined);
    render(<ServingHarness onSubmit={onSubmit} />);
    await user.dblClick(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ amount: 1.5, meal: 'Breakfast' });
    expect(screen.getByRole('button', { name: 'Continuing…' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Serving amount' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Meal' })).toBeDisabled();
    await act(async () => request.reject(new Error('private service diagnostic')));
    expect(screen.getByRole('alert')).toHaveTextContent(/choices are kept/);
    expect(screen.getByRole('textbox', { name: 'Serving amount' })).toHaveValue('1.5');
    expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveValue('Breakfast');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps supplied validation for unsupported meals associated with the visible label', () => {
    render(<MealSelect value="" onChange={vi.fn()} error="Choose a supported meal." />);
    expect(screen.getByRole('combobox', { name: 'Meal' })).toHaveAccessibleDescription(
      'Choose a supported meal.',
    );
  });
});

describe('shared notices and nutrition presentation', () => {
  it('shows a serving basis, long food name, zero and missing values with a keyboard selection action', async () => {
    const user = userEvent.setup();
    const choose = vi.fn();
    const name = 'Rolled oats with toasted seeds and a very long package description';
    render(
      <FoodCard
        name={name}
        servingBasis="40 g dry"
        nutrients={{ calories: 150, protein: 5.5, fat: 0, carbohydrates: 27, sodium: null }}
        onSelect={choose}
      />,
    );
    expect(screen.getByRole('article', { name })).toBeVisible();
    expect(screen.getByText('Per serving: 40 g dry')).toBeVisible();
    expect(screen.getByText('0 g')).toBeVisible();
    expect(screen.getByText('5.5 g')).toBeVisible();
    expect(screen.getByText('Not provided')).toBeVisible();
    await user.tab();
    expect(screen.getByRole('button', { name: `Choose ${name}` })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(choose).toHaveBeenCalledTimes(1);
  });

  it('labels unreviewed food and prevents catalog selection', async () => {
    const choose = vi.fn();
    const user = userEvent.setup();
    render(
      <FoodCard name="Sample food" servingBasis="1 package" pendingReview onSelect={choose} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      /Pending review.*not available as a reusable catalog food/,
    );
    await user.click(screen.getByRole('button', { name: 'Choose Sample food' }));
    expect(choose).not.toHaveBeenCalled();
    expect(screen.getAllByText('Not provided')).toHaveLength(5);
  });

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

  it('announces loading and empty states and offers persistent retry and empty recovery controls', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const add = vi.fn();
    render(
      <>
        <LoadingState />
        <EmptyState title="No foods yet" actionLabel="Find food" onAction={add}>
          Search for a food to start your diary.
        </EmptyState>
        <ErrorState onRetry={retry} />
      </>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Foods could not be loaded. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Find food' }));
    expect(add).toHaveBeenCalledTimes(1);
  });

  it('uses unique label and error associations for repeated fields', () => {
    render(
      <>
        {['First food', 'Second food'].map((label) => (
          <FormField key={label} label={label} error={`Check ${label}`}>
            {(props) => <input {...props} />}
          </FormField>
        ))}
      </>,
    );
    const first = screen.getByRole('textbox', { name: 'First food' });
    const second = screen.getByRole('textbox', { name: 'Second food' });
    expect(first.id).not.toBe(second.id);
    expect(first).toHaveAccessibleDescription('Check First food');
    expect(second).toHaveAccessibleDescription('Check Second food');
  });

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
});

it('locks repeat actions before a render and releases the lock after a failed action', async () => {
  const request = deferred();
  const action = vi.fn().mockReturnValue(request.promise);
  const { result } = renderHook(usePendingAction);
  let first;
  act(() => {
    first = result.current.run(action);
    result.current.run(action);
  });
  expect(action).toHaveBeenCalledTimes(1);
  await act(async () => {
    request.reject(new Error('local fixture'));
    await first;
  });
  expect(result.current.failed).toBe(true);
  expect(result.current.pending).toBe(false);
  await act(async () => {
    await result.current.run(() => undefined);
  });
  expect(result.current.failed).toBe(false);
});
