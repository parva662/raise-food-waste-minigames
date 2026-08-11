import { SERVICE_CLOSEOUT_CONFIG } from '../../config/serviceCloseout';
import { validateCloseoutQuantity, validateCloseoutWasteGrams } from '../validation';

interface CloseoutIntegerInputProps {
  id: string;
  value: number | null;
  disabled: boolean;
  error: string | null;
  className?: string;
  fieldLabel: string;
  describedBy?: string;
  mode: 'quantity' | 'waste';
  onChange: (value: number | null) => void;
  onValidationError: (error: string | null) => void;
}

export function CloseoutIntegerInput({
  id,
  value,
  disabled,
  error,
  className = '',
  fieldLabel,
  describedBy,
  mode,
  onChange,
  onValidationError,
}: CloseoutIntegerInputProps) {
  const displayValue = value === null ? '' : String(value);
  const maxLength =
    mode === 'quantity'
      ? String(SERVICE_CLOSEOUT_CONFIG.maxQuantity).length
      : String(SERVICE_CLOSEOUT_CONFIG.maxWasteGrams).length;

  const validate = mode === 'quantity' ? validateCloseoutQuantity : validateCloseoutWasteGrams;

  return (
    <input
      id={id}
      className={`${className}${error ? ' closeout-grid__input--error' : ''}`}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={maxLength}
      value={displayValue}
      disabled={disabled}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw.trim() === '') {
          onValidationError(null);
          onChange(null);
          return;
        }
        const result = validate(raw, fieldLabel);
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
