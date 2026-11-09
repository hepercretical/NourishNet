import FormField from './FormField.jsx';
import { meals } from '../../utils/foodForm.js';

export default function MealSelect({ value, onChange, error, disabled = false }) {
  return (
    <FormField label="Meal" error={error}>
      {(props) => (
        <select
          {...props}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">Choose a meal</option>
          {meals.map((meal) => (
            <option key={meal} value={meal}>
              {meal}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
