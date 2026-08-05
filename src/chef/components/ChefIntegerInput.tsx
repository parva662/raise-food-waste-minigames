import { CHEF_CONFIG } from '../../config/chef';
import { validateChefInteger } from '../validation';

interface ChefIntegerInputProps {
  id: string;
  value: number | null;
  disabled: boolean;
  error: string | null;
  className?: string;
  fieldLabel: string;
  describedBy?: string;
  onChange: (value: number | null) => void;
  onValidationError: (error: string | null) => void;
}

/**
 * Integer field driven by parent value (null = blank). No duplicate local state.
 */
export function ChefIntegerInput({
  id,
  value,
  disabled,
  error,
  className = '',
  fieldLabel,
  describedBy,
  onChange,
  onValidationError,
}: ChefIntegerInputProps) {
  const displayValue = value === null ? '' : String(value);

  return (
    <input
      id={id}
      className={`${className}${error ? ' chef-forecast-row__input--error' : ''}`}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={String(CHEF_CONFIG.maxForecastQuantity).length}
      value={displayValue}
      disabled={disabled}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw.trim() === '') {
          onValidationError(null);
          onChange(null);
          return;
        }
        const result = validateChefInteger(raw, fieldLabel);
        if (!result.ok) {
          onValidationError(result.error);
          return;
        }
        onValidationError(null);
        onChange(result.value);
      }}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
    />
  );
}
