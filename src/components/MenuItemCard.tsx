import { Leaf, Drumstick, Soup, CakeSlice } from 'lucide-react';
import type { MenuItem } from '../types/menu';
import { FoodImage } from './FoodImage';
import { QuantityControl } from './QuantityControl';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

function DietaryIcon({ category }: { category: MenuItem['category'] }) {
  switch (category) {
    case 'vegetarian':
      return <Leaf size={14} className="dietary-icon dietary-icon--vegetarian" aria-hidden="true" />;
    case 'classic':
      return <Drumstick size={14} className="dietary-icon dietary-icon--meat" aria-hidden="true" />;
    case 'soup':
      return <Soup size={14} className="dietary-icon dietary-icon--soup" aria-hidden="true" />;
    case 'dessert':
      return <CakeSlice size={14} className="dietary-icon dietary-icon--dessert" aria-hidden="true" />;
  }
}

export function MenuItemCard({
  item,
  quantity,
  onIncrement,
  onDecrement,
  disabled = false,
}: MenuItemCardProps) {
  return (
    <article className="menu-item-card">
      <div className="menu-item-card__image-wrap">
        <FoodImage
          src={item.image}
          alt={item.name}
          category={item.category}
          className="menu-item-card__image"
          fallbackClassName="menu-item-card__image-fallback"
          iconSize={22}
        />
      </div>

      <div className="menu-item-card__content">
        <div className="menu-item-card__info">
          <h3 className="menu-item-card__name">
            <span className="menu-item-card__name-text">{item.name}</span>
            <span className="menu-item-card__dietary">
              <DietaryIcon category={item.category} />
            </span>
          </h3>
          <p className="menu-item-card__unit">{item.unit}</p>
        </div>

        <div className="menu-item-card__controls">
          <QuantityControl
            quantity={quantity}
            maxQuantity={item.maxQuantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            disabled={disabled}
            itemName={item.name}
          />
          <span className="menu-item-card__max">Max {item.maxQuantity}</span>
        </div>
      </div>
    </article>
  );
}
