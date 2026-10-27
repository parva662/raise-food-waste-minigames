import type { PortionUnit, RecipeCompositionLine } from '@/products/kitchen-skills-challenge/domain/types';

const MASS_UNITS: ReadonlySet<PortionUnit> = new Set(['g', 'kg']);

/** Canonical grams text for a finite non-negative mass; empty when unusable. */
export function formatCanonicalGramsText(grams: number): string {
  if (!Number.isFinite(grams) || grams < 0) return '';
  const rounded = Math.round(grams * 1_000_000) / 1_000_000;
  return String(rounded);
}

/**
 * Portion Precision actual quantity as grams for Trim starting-weight prefill.
 * Returns null when the ingredient is missing, non-positive, or recorded in a
 * volume unit (dL / L) that must not be auto-converted to mass.
 */
export function portionCompositionMassGrams(
  composition: readonly RecipeCompositionLine[],
  ingredientId: string,
): number | null {
  const line = composition.find((entry) => entry.ingredientId === ingredientId);
  if (!line || !MASS_UNITS.has(line.unit)) return null;
  if (!Number.isFinite(line.actualAmount) || line.actualAmount <= 0) return null;
  if (line.unit === 'kg') return line.actualAmount * 1000;
  return line.actualAmount;
}
