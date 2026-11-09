import Button from './Button.jsx';
import NutritionFacts from './NutritionFacts.jsx';
import PendingStatus from './PendingStatus.jsx';

export default function FoodCard({
  name,
  servingBasis,
  nutrients,
  pendingReview = false,
  onSelect,
  disabled = false,
}) {
  return (
    <article className="shared-card" aria-label={name}>
      <h3 className="shared-card__title">{name}</h3>
      <p>Per serving: {servingBasis}</p>
      <NutritionFacts values={nutrients} />
      {pendingReview && <PendingStatus />}
      {onSelect && (
        <Button disabled={disabled || pendingReview} onClick={onSelect}>
          Choose {name}
        </Button>
      )}
    </article>
  );
}
