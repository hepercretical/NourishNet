import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import SearchForm from '../SearchForm/SearchForm.jsx';

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

it('associates the search length limit with the field and keeps the text for correction', async () => {
  const user = userEvent.setup();
  const onSearch = vi.fn();
  render(<SearchHarness onSearch={onSearch} />);
  const input = screen.getByRole('searchbox');
  await user.type(input, `${'a'.repeat(101)}{Enter}`);
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription(/100 search characters/);
  expect(input).toHaveValue('a'.repeat(101));
  expect(onSearch).not.toHaveBeenCalled();
  await user.clear(input);
  await user.type(input, `${'a'.repeat(100)}{Enter}`);
  expect(onSearch).toHaveBeenCalledExactlyOnceWith('a'.repeat(100));
});

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
