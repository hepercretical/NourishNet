import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import FormField from '../FormField/FormField.jsx';

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
