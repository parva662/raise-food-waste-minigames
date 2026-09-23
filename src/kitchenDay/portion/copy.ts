import { formatGrams, formatWastePercent } from '../format';
import type { RecipeCompositionLine } from '../types';
import type { RecipeReferenceLine } from './recipes';
import { evaluatePortionLine } from './deviations';
import {
  finalWeightDifferenceGrams,
  signedDeviationPercent,
} from './metrics';

export function formatPortionDeviation(
  required: RecipeReferenceLine,
  actual: RecipeCompositionLine,
): string {
  const outcome = evaluatePortionLine(required, actual);
  if (outcome === 'exact match') return 'Exact';
  const percent = signedDeviationPercent(actual.actualAmount, required.requiredAmount);
  if (percent == null) return '—';
  const label = `${Math.abs(percent).toFixed(1)}%`;
  return outcome === 'over-measure' ? `${label} over` : `${label} under`;
}

export function formatPortionDifference(
  required: RecipeReferenceLine,
  actual: RecipeCompositionLine,
): string {
  const outcome = evaluatePortionLine(required, actual);
  if (outcome === 'exact match') return 'Exact';
  const difference = Math.abs(actual.actualAmount - required.requiredAmount);
  const amount = formatGrams(difference).replace(' g', ` ${actual.unit}`);
  return outcome === 'over-measure' ? `${amount} over` : `${amount} under`;
}

export function formatFinalWeightDifference(
  recordedFinalWeightGrams: number,
  expectedFinalWeightGrams: number,
): string {
  const difference = finalWeightDifferenceGrams(recordedFinalWeightGrams, expectedFinalWeightGrams);
  if (difference == null) return '—';
  if (difference === 0) return 'Exact';
  const amount = formatGrams(Math.abs(difference));
  return difference > 0 ? `${amount} over` : `${amount} under`;
}

export function formatMetricPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return formatWastePercent(value);
}
