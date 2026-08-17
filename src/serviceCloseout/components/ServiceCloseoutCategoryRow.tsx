import type { CloseoutCategoryKey } from '../types';
import { CLOSEOUT_CATEGORY_LABELS } from '../types';
import { getPortionWeightGrams } from '../portionWeight';
import type { StaffForecastEntry } from '../forecast/formatStaffForecasts';
import { formatStaffForecastCell } from '../forecast/formatStaffForecasts';
import { CloseoutIntegerInput } from './CloseoutIntegerInput';

interface ServiceCloseoutCategoryRowProps {
  categoryKey: CloseoutCategoryKey;
  itemName: string;
  itemId: string;
  preparedQuantity: number | null;
  overproductionGrams: number | null;
  forecastEntries: readonly StaffForecastEntry[];
  preparedError: string | null;
  wasteError: string | null;
  disabled: boolean;
  onPreparedChange: (value: number | null) => void;
  onWasteChange: (value: number | null) => void;
  onPreparedError: (error: string | null) => void;
  onWasteError: (error: string | null) => void;
}

function formatForecastDisplay(entries: readonly StaffForecastEntry[]): string {
  if (entries.length === 0) return '—';
  const compact = formatStaffForecastCell(entries);
  if (entries.length === 1 && entries[0]!.quantity !== null && entries[0]!.quantity !== undefined) {
    return `${entries[0]!.quantity} portions`;
  }
  return compact
    .split('\n')
    .map((line) => {
      const [name, quantity] = line.split(' — ');
      return quantity === '—' ? `${name} — —` : `${name} — ${quantity} portions`;
    })
    .join('\n');
}

export function ServiceCloseoutCategoryRow({
  categoryKey,
  itemName,
  itemId,
  preparedQuantity,
  overproductionGrams,
  forecastEntries,
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
          className="closeout-grid__forecast closeout-grid__forecast--multiline"
          aria-labelledby={forecastId}
          data-testid={`closeout-forecast-${categoryKey}`}
        >
          {formatForecastDisplay(forecastEntries)}
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
