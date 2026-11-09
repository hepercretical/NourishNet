import { estimateNotice } from '../../design/screens.js';
import Notice from './Notice.jsx';
import NutritionFacts from './NutritionFacts.jsx';

// Presentation only. Formula approval and estimate acceptance are owned by Plan-13/19.
export default function EstimateSummary({ values, explanation, effectiveDate }) {
  return (
    <section className="shared-card" aria-label="Goal estimate">
      <h2>Estimated daily nutrition</h2>
      {values ? (
        <NutritionFacts values={values} />
      ) : (
        <p>Calories: Not calculated · Macronutrient targets: Not calculated</p>
      )}
      <Notice title="About this estimate">
        <p>{estimateNotice}</p>
      </Notice>
      <p>
        {explanation ||
          'Formula, units, assumptions, limitations, and version await human and qualified review in Plan-13. No estimate is calculated here.'}
      </p>
      {effectiveDate && <p>Effective date: {effectiveDate}</p>}
    </section>
  );
}
