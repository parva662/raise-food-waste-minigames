import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  maxQuantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  incrementDisabled?: boolean;
  decrementDisabled?: boolean;
  itemName: string;
  compact?: boolean;
}

export function QuantityControl({
  quantity,
  maxQuantity,
  onIncrement,
  onDecrement,
  disabled = false,
  incrementDisabled,
  decrementDisabled,
  itemName,
  compact = false,
}: QuantityControlProps) {
  const minusDisabled = (decrementDisabled ?? disabled) || quantity <= 0;
  const plusDisabled = (incrementDisabled ?? disabled) || quantity >= maxQuantity;

  return (
    <div className={`quantity-control${compact ? ' quantity-control--compact' : ''}`}>
      <button
        type="button"
        className="quantity-control__btn"
        onClick={onDecrement}
        disabled={minusDisabled}
        aria-label={`Decrease ${itemName}`}
      >
        <Minus size={compact ? 14 : 16} aria-hidden="true" />
      </button>
      <span className="quantity-control__value" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="quantity-control__btn"
        onClick={onIncrement}
        disabled={plusDisabled}
        aria-label={`Increase ${itemName}`}
      >
        <Plus size={compact ? 14 : 16} aria-hidden="true" />
      </button>
      <span className="quantity-control__max">Max {maxQuantity}</span>
    </div>
  );
}
