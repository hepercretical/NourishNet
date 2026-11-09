import '../shared/shared.css';
import FormField from '../FormField/FormField.jsx';

export default function ServingInput({ value, onChange, servingBasis, error, disabled = false }) {
  return (
    <FormField
      label="Serving amount"
      hint={`Number of servings. One serving: ${servingBasis}. Decimals such as 1.5 are welcome.`}
      error={error}
    >
      {(props) => (
        <input
          {...props}
          type="text"
          inputMode="decimal"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
      )}
    </FormField>
  );
}
