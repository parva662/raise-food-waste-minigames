import type { MenuItem } from '@/shared/menu/types';
import { FoodImage } from '@/products/lunch-declaration/components/FoodImage';
import { QuantityControl } from '@/products/lunch-declaration/components/QuantityControl';

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

  const activate = () => {
    if (!menuInteractive) return;
    onActivateSection();
  };

  return (
    <div
      className={`portion-food-card${selected ? ' portion-food-card--selected' : ''}${!sectionActive ? ' portion-food-card--inactive-section' : ''}`}
    >
      <button
        type="button"
        className="portion-food-card__select"
        onClick={activate}
        disabled={!menuInteractive}
        aria-pressed={selected || sectionActive}
        aria-label={`Select ${categoryLabel}: ${item.name}`}
      >
        <FoodImage
          src={item.imageDedicated ?? item.image}
          placeholderSrc={item.imagePlaceholder}
          alt=""
          category={item.category}
          className="portion-food-card__image"
          fallbackClassName="portion-food-card__image-fallback"
          iconSize={20}
        />
        <p className="portion-food-card__role">{categoryLabel}</p>
        <h3 className="portion-food-card__name">{item.name}</h3>
      </button>
      <div className="portion-food-card__quantity">
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
    </div>
  );
}
