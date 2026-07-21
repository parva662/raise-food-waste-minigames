import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  maxQuantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  size?: 'default' | 'compact';
  itemName?: string;
}

export function QuantityControl({
  quantity,
  maxQuantity,
  onIncrement,
  onDecrement,
  disabled = false,
  size = 'default',
  itemName,
}: QuantityControlProps) {
  const label = itemName ? ` for ${itemName}` : '';
  const minusDisabled = disabled || quantity <= 0;
  const plusDisabled = disabled || quantity >= maxQuantity;

  return (
    <div className={`quantity-control quantity-control--${size}`}>
      <button
        type="button"
        className="quantity-control__btn"
        onClick={onDecrement}
        disabled={minusDisabled}
        aria-label={`Decrease quantity${label}`}
      >
        <Minus size={size === 'compact' ? 14 : 16} aria-hidden="true" />
      </button>
      <span className="quantity-control__value" aria-live="polite" aria-atomic="true">
        {quantity}
      </span>
      <button
        type="button"
        className="quantity-control__btn"
        onClick={onIncrement}
        disabled={plusDisabled}
        aria-label={`Increase quantity${label}`}
      >
        <Plus size={size === 'compact' ? 14 : 16} aria-hidden="true" />
      </button>
    </div>
  );
}
