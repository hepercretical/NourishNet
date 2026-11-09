const nutrients = [
  ['calories', 'Calories', 'kcal'],
  ['protein', 'Protein', 'g'],
  ['fat', 'Fat', 'g'],
  ['carbohydrates', 'Carbohydrates', 'g'],
  ['sodium', 'Sodium', 'mg'],
];

// Display the supplied precision unchanged. No scaling or goal calculations run here.
export default function NutritionFacts({ values = {} }) {
  return (
    <dl className="shared-nutrition">
      {nutrients.map(([key, label, unit]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>
            {Number.isFinite(values[key]) && values[key] >= 0
              ? `${values[key]} ${unit}`
              : 'Not provided'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
