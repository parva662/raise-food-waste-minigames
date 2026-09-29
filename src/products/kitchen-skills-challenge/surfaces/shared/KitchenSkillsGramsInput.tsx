import { sanitizeNonNegativeDecimalInput } from '@/products/kitchen-skills-challenge/domain/gramsInput';

export function KitchenSkillsGramsInput({
  value,
  onChange,
  testId,
  disabled,
  id,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  testId: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      id={id}
      className="kitchen-day-input kitchen-day-input--numeric"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      aria-label={ariaLabel}
      data-testid={testId}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(sanitizeNonNegativeDecimalInput(event.target.value))}
    />
  );
}
