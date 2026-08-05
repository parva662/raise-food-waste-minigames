import { Users } from 'lucide-react';
import { ChefIntegerInput } from './ChefIntegerInput';

interface ChefExpectedCustomersFieldProps {
  value: number | null;
  disabled: boolean;
  error: string | null;
  onChange: (value: number | null) => void;
  onValidationError: (error: string | null) => void;
}

export function ChefExpectedCustomersField({
  value,
  disabled,
  error,
  onChange,
  onValidationError,
}: ChefExpectedCustomersFieldProps) {
  return (
    <div className="chef-customers-row">
      <div className="chef-customers-row__thumb" aria-hidden="true">
        <div className="chef-customers-row__icon">
          <Users size={16} strokeWidth={2} />
        </div>
      </div>
      <div className="chef-customers-row__info">
        <label className="chef-customers-row__label" htmlFor="chef-expected-customers">
          Expected total customers
        </label>
      </div>
      <div className="chef-customers-row__quantity">
        <ChefIntegerInput
          id="chef-expected-customers"
          className="chef-forecast-row__input"
          value={value}
          disabled={disabled}
          error={error}
          fieldLabel="Expected customers"
          describedBy={error ? 'chef-customers-error chef-customers-support' : 'chef-customers-support'}
          onChange={onChange}
          onValidationError={onValidationError}
        />
        <span className="chef-forecast-row__unit">customers</span>
      </div>
      {error && (
        <p id="chef-customers-error" className="chef-customers-row__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
