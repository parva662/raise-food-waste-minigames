import { useEffect, useState } from 'react';
import { sanitizeNonNegativeDecimalInput } from '@/products/kitchen-skills-challenge/domain/gramsInput';
import {
  gramsTextToMassInput,
  massInputToGramsText,
  MASS_INPUT_UNITS,
  type MassInputUnit,
} from '@/products/kitchen-skills-challenge/domain/mass';

/**
 * Mass field with a compact g/kg selector. The parent always receives canonical grams text.
 * Switching the unit converts the displayed number so the physical quantity stays the same.
 */
export function KitchenSkillsMassInput({
  value,
  onChange,
  testId,
  disabled,
  id,
  ariaLabel,
  unitGroupLabel,
  defaultUnit = 'g',
}: {
  /** Canonical grams text. */
  value: string;
  onChange: (gramsText: string) => void;
  testId: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  unitGroupLabel?: string;
  /** Initial display unit; defaults to grams for ingredient and waste entry. */
  defaultUnit?: MassInputUnit;
}) {
  const [unit, setUnit] = useState<MassInputUnit>(defaultUnit);
  const [text, setText] = useState(() => gramsTextToMassInput(value, defaultUnit));

  useEffect(() => {
    if (massInputToGramsText(text, unit) === massInputToGramsText(value, 'g')) return;
    setText(gramsTextToMassInput(value, unit));
    // Only external value changes (e.g. a reset after save) should rewrite the typed text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function updateText(raw: string) {
    const next = sanitizeNonNegativeDecimalInput(raw);
    setText(next);
    onChange(massInputToGramsText(next, unit));
  }

  function updateUnit(next: MassInputUnit) {
    if (next === unit) return;
    const gramsText = massInputToGramsText(text, unit);
    setUnit(next);
    setText(gramsTextToMassInput(gramsText, next));
    onChange(gramsText);
  }

  return (
    <div className="kitchen-day-mass-input">
      <input
        id={id}
        className="kitchen-day-input kitchen-day-input--numeric"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        data-testid={testId}
        data-unit={unit}
        value={text}
        disabled={disabled}
        onChange={(event) => updateText(event.target.value)}
      />
      <div
        className="kitchen-day-unit-toggle"
        role="group"
        aria-label={unitGroupLabel ?? (ariaLabel ? `${ariaLabel} unit` : 'Unit')}
      >
        {MASS_INPUT_UNITS.map((option) => (
          <button
            key={option}
            type="button"
            className={
              option === unit
                ? 'kitchen-day-unit-toggle__option kitchen-day-unit-toggle__option--active'
                : 'kitchen-day-unit-toggle__option'
            }
            aria-pressed={option === unit}
            data-testid={`${testId}-unit-${option}`}
            disabled={disabled}
            onClick={() => updateUnit(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
