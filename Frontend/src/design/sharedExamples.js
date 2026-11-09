export const sampleFood = {
  name: 'Sample rolled oats with toasted seeds and a deliberately long package description',
  servingBasis: '40 g dry',
  nutrients: { calories: 150, protein: 5, fat: 3, carbohydrates: 27, sodium: null },
};

// Local, synthetic interaction fixtures only. No API, persistence, or goal calculation.
export async function previewAction(outcome) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (outcome === 'error') throw new Error('Local preview failure');
}
