import { sanitizeNonNegativeDecimalInput } from '@/products/kitchen-skills-challenge/domain/gramsInput';

export function KitchenSkillsGramsInput({
  value,
  onChange,
  testId,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  testId: string;
  disabled?: boolean;
}) {
  return (
    <input
      className="kitchen-day-input kitchen-day-input--numeric"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      data-testid={testId}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(sanitizeNonNegativeDecimalInput(event.target.value))}
    />
  );
}
