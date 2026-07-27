import type { MenuItem } from '../types/menu';
import { FoodImage } from './FoodImage';
import { QuantityControl } from './QuantityControl';

interface PortionFoodCardProps {
  item: MenuItem;
  categoryLabel: string;
  quantity: number;
  onActivateSection: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  sectionActive: boolean;
  menuInteractive: boolean;
}

export function PortionFoodCard({
  item,
  categoryLabel,
  quantity,
  onActivateSection,
  onIncrement,
  onDecrement,
  sectionActive,
  menuInteractive,
}: PortionFoodCardProps) {
  const selected = quantity > 0;
  const canDecrement = menuInteractive && sectionActive;

  return (
    <article
      className={`portion-food-card${selected ? ' portion-food-card--selected' : ''}${!sectionActive ? ' portion-food-card--inactive-section' : ''}`}
      onClick={menuInteractive ? onActivateSection : undefined}
      onKeyDown={(event) => {
        if (!menuInteractive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivateSection();
        }
      }}
      role="group"
      aria-label={`${categoryLabel}: ${item.name}`}
      tabIndex={menuInteractive ? 0 : undefined}
    >
      <FoodImage
        src={item.image}
        alt=""
        category={item.category}
        className="portion-food-card__image"
        fallbackClassName="portion-food-card__image-fallback"
        iconSize={20}
      />
      <p className="portion-food-card__role">{categoryLabel}</p>
      <h3 className="portion-food-card__name">{item.name}</h3>
      <div className="portion-food-card__quantity" onClick={(event) => event.stopPropagation()}>
        <QuantityControl
          quantity={quantity}
          maxQuantity={item.maxQuantity}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          incrementDisabled={!menuInteractive || quantity >= item.maxQuantity}
          decrementDisabled={!canDecrement || quantity <= 0}
          itemName={item.name}
          compact
        />
      </div>
    </article>
  );
}
