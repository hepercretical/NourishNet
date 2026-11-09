import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import ServingInput from './ServingInput.jsx';
function Harness() {
  const [value, setValue] = useState('');
  return <ServingInput value={value} onChange={setValue} servingBasis="40 g dry" />;
}
it('keeps decimal input and associates the serving basis with its visible label', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByRole('textbox', { name: 'Serving amount' });
  expect(input).toHaveAccessibleDescription(/One serving: 40 g dry/);
  await user.type(input, '1.5');
  expect(input).toHaveValue('1.5');
});
it('announces validation and prevents editing while disabled', () => {
  render(<ServingInput value="0" onChange={() => {}} error="Enter a positive amount." disabled />);
  const input = screen.getByRole('textbox', { name: 'Serving amount' });
  expect(input).toBeDisabled();
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription(/Enter a positive amount/);
});
