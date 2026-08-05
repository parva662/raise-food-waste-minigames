import type { MenuItem } from '../../types/menu';
import { FoodImage } from '../../components/FoodImage';
import { CHEF_INTEGER_RANGE_ERROR } from '../validation';
import { ChefIntegerInput } from './ChefIntegerInput';

interface ChefForecastRowProps {
  item: MenuItem;
  categoryLabel: string;
  quantity: number | null;
  disabled: boolean;
  error: string | null;
  onQuantityChange: (value: number | null) => void;
  onValidationError: (error: string | null) => void;
}

export function ChefForecastRow({
  item,
  categoryLabel,
  quantity,
  disabled,
  error,
  onQuantityChange,
  onValidationError,
}: ChefForecastRowProps) {
  return (
    <div className="chef-forecast-row" role="group" aria-label={`${categoryLabel}: ${item.name}`}>
      <div className="chef-forecast-row__thumb">
        <FoodImage
          src={item.imageDedicated ?? item.image}
          placeholderSrc={item.imagePlaceholder}
          alt={item.name}
          category={item.category}
          className="chef-forecast-row__image"
          fallbackClassName="chef-forecast-row__image-fallback"
          iconSize={16}
        />
      </div>
      <div className="chef-forecast-row__info">
        <span className="chef-forecast-row__category">{categoryLabel}</span>
        <span className="chef-forecast-row__name">{item.name}</span>
      </div>
      <div className="chef-forecast-row__quantity">
        <label className="chef-forecast-row__qty-label" htmlFor={`chef-qty-${item.id}`}>
          Portions
        </label>
        <ChefIntegerInput
          id={`chef-qty-${item.id}`}
          className="chef-forecast-row__input"
          value={quantity}
          disabled={disabled}
          error={error}
          fieldLabel={`${categoryLabel} portions`}
          describedBy={error ? `chef-qty-error-${item.id}` : undefined}
          onChange={onQuantityChange}
          onValidationError={onValidationError}
        />
        <span className="chef-forecast-row__unit">portions</span>
      </div>
      {error && (
        <p id={`chef-qty-error-${item.id}`} className="chef-forecast-row__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { CHEF_INTEGER_RANGE_ERROR };
