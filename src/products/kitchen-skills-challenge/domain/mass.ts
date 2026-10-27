import { sanitizeNonNegativeDecimalInput } from '@/products/kitchen-skills-challenge/domain/gramsInput';

export const MASS_INPUT_UNITS = ['g', 'kg'] as const;
export type MassInputUnit = (typeof MASS_INPUT_UNITS)[number];

const GRAMS_PER_KG_EXPONENT = 3;

function trimDecimalText(intPart: string, fracPart: string): string {
  const integer = intPart.replace(/^0+(?=\d)/, '') || '0';
  const fraction = fracPart.replace(/0+$/, '');
  return fraction ? `${integer}.${fraction}` : integer;
}

/**
 * Moves the decimal point of a non-negative decimal string by `places` (positive = ×10^places)
 * without floating-point arithmetic, so 1.0005 kg → 1000.5 g exactly.
 */
export function shiftDecimalText(raw: string, places: number): string {
  const text = sanitizeNonNegativeDecimalInput(raw);
  if (text === '' || text === '.') return '';
  const [intRaw = '', fracRaw = ''] = text.split('.');
  const digits = `${intRaw}${fracRaw}`;
  const pointIndex = intRaw.length + places;
  if (pointIndex <= 0) {
    return trimDecimalText('0', `${'0'.repeat(-pointIndex)}${digits}`);
  }
  if (pointIndex >= digits.length) {
    return trimDecimalText(`${digits}${'0'.repeat(pointIndex - digits.length)}`, '');
  }
  return trimDecimalText(digits.slice(0, pointIndex), digits.slice(pointIndex));
}

/** Canonical grams text for a typed mass value; '' when nothing numeric was typed. */
export function massInputToGramsText(raw: string, unit: MassInputUnit): string {
  return unit === 'kg' ? shiftDecimalText(raw, GRAMS_PER_KG_EXPONENT) : shiftDecimalText(raw, 0);
}

/** Text to show for canonical grams in the given display unit. */
export function gramsTextToMassInput(gramsText: string, unit: MassInputUnit): string {
  return unit === 'kg' ? shiftDecimalText(gramsText, -GRAMS_PER_KG_EXPONENT) : gramsText;
}

/** Canonical grams for a typed mass value, or null when the text is not a usable number. */
export function parseMassInputGrams(raw: string, unit: MassInputUnit): number | null {
  const gramsText = massInputToGramsText(raw, unit);
  if (gramsText === '') return null;
  const value = Number(gramsText);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Initial g/kg display unit for a known gram quantity.
 * Matches summary formatting: masses above 1000 g prefer kg so students type the
 * same number they see on the recipe target (e.g. target 2 kg → start in kg).
 */
export function preferredMassInputUnit(grams: number | null | undefined): MassInputUnit {
  if (grams != null && Number.isFinite(grams) && grams > 1000) return 'kg';
  return 'g';
}
