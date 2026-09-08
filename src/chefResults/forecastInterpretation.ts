import { formatGrams } from './useChefResultsData';

/** Tolerance for treating actual and estimated surplus as equivalent (grams). */
export const SURPLUS_COMPARISON_TOLERANCE_GRAMS = 1;

export function buildActualVsEstimatedSurplusInsight(
  actualSurplusGrams: number,
  estimatedSurplusGrams: number,
): string | null {
  const delta = estimatedSurplusGrams - actualSurplusGrams;

  if (Math.abs(delta) <= SURPLUS_COMPARISON_TOLERANCE_GRAMS) {
    return 'Your forecast would have resulted in approximately the same surplus as the actual kitchen production.';
  }

  if (delta < 0) {
    return `Your forecast would have produced about ${formatGrams(Math.abs(delta))} less surplus than the kitchen actually recorded.`;
  }

  return `Your forecast would have produced about ${formatGrams(delta)} more surplus than the kitchen actually recorded.`;
}

export type CategoryOutcomeKind = 'surplus' | 'shortage' | 'on-target';

export function getCategoryOutcomeKind(
  simulatedOverproductionGrams: number,
  simulatedShortageGrams: number,
): CategoryOutcomeKind {
  if (simulatedShortageGrams > 0) return 'shortage';
  if (simulatedOverproductionGrams > 0) return 'surplus';
  return 'on-target';
}

export function formatCategoryOutcomeLabel(
  kind: CategoryOutcomeKind,
  grams: number,
): string {
  if (kind === 'on-target') return 'On target';
  if (kind === 'shortage') return `${formatGrams(grams)} estimated shortage`;
  return `${formatGrams(grams)} estimated surplus`;
}

export function buildCategoryAriaLabel(
  categoryName: string,
  kind: CategoryOutcomeKind,
  grams: number,
): string {
  if (kind === 'on-target') return `${categoryName}: on target`;
  const rounded = Math.round(grams);
  if (kind === 'shortage') return `${categoryName}: estimated shortage ${rounded} grams`;
  return `${categoryName}: estimated surplus ${rounded} grams`;
}
