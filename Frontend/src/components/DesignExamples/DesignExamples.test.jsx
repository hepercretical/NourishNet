import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import {
  FoodExample,
  DiaryExample,
  UploadExample,
  EstimateExample,
  SharingExample,
  CalendarExample,
} from './DesignExamples.jsx';
it('shows fictional food with a serving basis and explicitly missing sodium', () => {
  render(<FoodExample />);
  expect(screen.getByRole('region', { name: 'Synthetic food example' })).toHaveTextContent(
    '40 g dry',
  );
  expect(screen.getAllByText(/Sodium: Not provided/)).toHaveLength(2);
});
it('provides an add-food path for each meal and identifies an incomplete day', () => {
  render(<DiaryExample />);
  expect(screen.getByText(/Day incomplete/)).toBeVisible();
  expect(screen.getByRole('heading', { name: /November 9/ })).toHaveAttribute('tabindex', '-1');
  expect(screen.getByRole('link', { name: 'Add food to breakfast' })).toHaveTextContent('＋');
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snack'])
    expect(screen.getByRole('link', { name: 'Add food to ' + meal })).toHaveAttribute(
      'href',
      '#/search',
    );
});
it('keeps sample photo controls disabled before upload functionality is implemented', () => {
  render(<UploadExample />);
  expect(screen.getByText(/No file is selected/)).toBeVisible();
  expect(screen.getAllByRole('button')).toHaveLength(6);
  for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
});
it('explains that goal estimates await approval without calculating values', () => {
  render(<EstimateExample />);
  expect(screen.getByText(/Calories: Not calculated/)).toBeVisible();
  expect(screen.getByText(/not professional medical advice/)).toBeVisible();
  expect(screen.getByText(/Saving is unavailable/)).toBeVisible();
});
it('leaves progress sharing unchecked and unavailable in the design example', () => {
  render(<SharingExample />);
  const checkbox = screen.getByRole('checkbox', { name: /Share selected daily goal progress/ });
  expect(checkbox).not.toBeChecked();
  expect(checkbox).toBeDisabled();
});
it('preserves a valid selected date when navigating from December to November', async () => {
  const user = userEvent.setup();
  render(<CalendarExample comparison />);
  await user.click(screen.getByRole('button', { name: 'Next month' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Day details' }), '31');
  await user.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(screen.getByRole('combobox', { name: 'Day details' })).toHaveValue('30');
  expect(screen.getByRole('status')).toHaveTextContent('November 30, 2026');
  expect(screen.getByRole('status')).toHaveTextContent('Morgan: Not shared');
});
