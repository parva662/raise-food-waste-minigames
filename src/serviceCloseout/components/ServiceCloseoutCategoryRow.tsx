import type { CloseoutCategoryKey } from '../types';
import { CLOSEOUT_CATEGORY_LABELS } from '../types';
import { getPortionWeightGrams } from '../portionWeight';
import { CloseoutIntegerInput } from './CloseoutIntegerInput';

interface ServiceCloseoutCategoryRowProps {
  categoryKey: CloseoutCategoryKey;
  itemName: string;
  itemId: string;
  preparedQuantity: number | null;
  overproductionGrams: number | null;
  forecastQuantity: number | null | undefined;
  preparedError: string | null;
  wasteError: string | null;
  disabled: boolean;
  onPreparedChange: (value: number | null) => void;
  onWasteChange: (value: number | null) => void;
  onPreparedError: (error: string | null) => void;
  onWasteError: (error: string | null) => void;
}

function formatForecastQuantity(quantity: number | null | undefined): string {
  if (quantity === null || quantity === undefined) return '—';
  return `${quantity} portions`;
}

export function ServiceCloseoutCategoryRow({
  categoryKey,
  itemName,
  itemId,
  preparedQuantity,
  overproductionGrams,
  forecastQuantity,
  preparedError,
  wasteError,
  disabled,
  onPreparedChange,
  onWasteChange,
  onPreparedError,
  onWasteError,
}: ServiceCloseoutCategoryRowProps) {
  const label = CLOSEOUT_CATEGORY_LABELS[categoryKey];
  const portionWeight = getPortionWeightGrams(itemId, categoryKey);
  const preparedId = `closeout-prepared-${categoryKey}`;
  const wasteId = `closeout-waste-${categoryKey}`;
  const forecastId = `closeout-forecast-${categoryKey}`;

  return (
    <div className="closeout-grid__row" role="group" aria-label={`${label}: ${itemName}`}>
      <div className="closeout-grid__dish">
        <span className="closeout-grid__category">{label}</span>
        <span className="closeout-grid__name">{itemName}</span>
      </div>
      <div className="closeout-grid__cell closeout-grid__cell--forecast">
        <span className="closeout-grid__sr-only" id={forecastId}>
          {label} submitted forecast
        </span>
        <span
          className="closeout-grid__forecast"
          aria-labelledby={forecastId}
          data-testid={`closeout-forecast-${categoryKey}`}
        >
          {formatForecastQuantity(forecastQuantity)}
        </span>
      </div>
      <div className="closeout-grid__cell closeout-grid__cell--prepared">
        <label className="closeout-grid__sr-only" htmlFor={preparedId}>
          {label} prepared portions
        </label>
        <CloseoutIntegerInput
          id={preparedId}
          className="closeout-grid__input"
          value={preparedQuantity}
          disabled={disabled}
          error={preparedError}
          fieldLabel={`${label} prepared portions`}
          mode="quantity"
          describedBy={preparedError ? `${preparedId}-error` : undefined}
          onChange={onPreparedChange}
          onValidationError={onPreparedError}
        />
        <span className="closeout-grid__unit">portions</span>
      </div>
      <div className="closeout-grid__cell closeout-grid__cell--weight">
        <span className="closeout-grid__weight" aria-label={`${label} standard portion weight`}>
          {portionWeight} g / portion
        </span>
      </div>
      <div className="closeout-grid__cell closeout-grid__cell--waste">
        <label className="closeout-grid__sr-only" htmlFor={wasteId}>
          {label} overproduction waste
        </label>
        <CloseoutIntegerInput
          id={wasteId}
          className="closeout-grid__input"
          value={overproductionGrams}
          disabled={disabled}
          error={wasteError}
          fieldLabel={`${label} overproduction waste`}
          mode="waste"
          describedBy={wasteError ? `${wasteId}-error` : undefined}
          onChange={onWasteChange}
          onValidationError={onWasteError}
        />
        <span className="closeout-grid__unit">g waste</span>
      </div>
      {(preparedError || wasteError) && (
        <div className="closeout-grid__errors">
          {preparedError && (
            <p id={`${preparedId}-error`} className="closeout-grid__error" role="alert">
              {preparedError}
            </p>
          )}
          {wasteError && (
            <p id={`${wasteId}-error`} className="closeout-grid__error" role="alert">
              {wasteError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
