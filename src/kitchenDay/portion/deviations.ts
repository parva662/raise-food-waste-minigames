import type { RecipeCompositionLine } from '../types';
import type { RecipeReferenceLine } from './recipes';

export type PortionDeviationOutcome = 'exact match' | 'over-measure' | 'under-measure';

export function evaluatePortionLine(
  required: RecipeReferenceLine,
  actual: RecipeCompositionLine,
): PortionDeviationOutcome {
  if (actual.actualAmount === required.requiredAmount) return 'exact match';
  if (actual.actualAmount > required.requiredAmount) return 'over-measure';
  return 'under-measure';
}
