import type { RecipeCompositionLine } from '@/products/kitchen-skills-challenge/domain/types';
import type { RecipeReferenceLine } from '@/products/kitchen-skills-challenge/domain/portion/recipes';

export type PortionDeviationOutcome = 'exact match' | 'over-measure' | 'under-measure';

export function evaluatePortionLine(
  required: RecipeReferenceLine,
  actual: RecipeCompositionLine,
): PortionDeviationOutcome {
  if (actual.actualAmount === required.requiredAmount) return 'exact match';
  if (actual.actualAmount > required.requiredAmount) return 'over-measure';
  return 'under-measure';
}
