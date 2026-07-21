import { X } from 'lucide-react';
import type { SelectionEntry } from '../types/menu';
import { foodCatalogue } from '../data/foodCatalogue';
import { FoodImage } from './FoodImage';
import { QuantityControl } from './QuantityControl';

interface SelectedItemProps {
  entry: SelectionEntry;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function SelectedItem({
  entry,
  onIncrement,
  onDecrement,
  onRemove,
  disabled = false,
}: SelectedItemProps) {
  const menuItem = foodCatalogue[entry.itemId];
  const maxQuantity = menuItem?.maxQuantity ?? entry.quantity;
  const category = menuItem?.category ?? 'vegetarian';

  return (
    <li className="selected-item">
      <div className="selected-item__thumb">
        {menuItem ? (
          <FoodImage
            src={menuItem.image}
            alt=""
            category={category}
            className="selected-item__thumb-img"
            fallbackClassName="selected-item__thumb-fallback"
            iconSize={16}
          />
        ) : (
          <div className="selected-item__thumb-fallback" aria-hidden="true" />
        )}
      </div>
      <div className="selected-item__details">
        <span className="selected-item__name">{entry.name}</span>
        <span className="selected-item__unit">{entry.unit}</span>
      </div>
      <QuantityControl
        quantity={entry.quantity}
        maxQuantity={maxQuantity}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        disabled={disabled}
        size="compact"
        itemName={entry.name}
      />
      <button
        type="button"
        className="selected-item__remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${entry.name} from selection`}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </li>
  );
}
