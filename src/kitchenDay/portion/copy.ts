import { formatGrams } from '../format';
import type { RecipeCompositionLine } from '../types';
import type { RecipeReferenceLine } from './recipes';
import { evaluatePortionLine } from './deviations';

export function formatPortionDeviation(
  required: RecipeReferenceLine,
  actual: RecipeCompositionLine,
): string {
  const outcome = evaluatePortionLine(required, actual);
  if (outcome === 'exact match') return 'Exact';
  const difference = Math.abs(actual.actualAmount - required.requiredAmount);
  const amount = formatGrams(difference).replace(' g', ` ${actual.unit}`);
  return outcome === 'over-measure' ? `${amount} over` : `${amount} under`;
}
