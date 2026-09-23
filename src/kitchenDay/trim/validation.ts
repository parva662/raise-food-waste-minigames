import { normalizeIngredientId } from '../../trimSmart/ingredientId';
import { isKitchenDayIngredientCategory } from './categories';
import { isTrimTechnique } from './techniques';

export type GramsParse =
  | { ok: true; value: number }
  | { ok: false; issue: 'blank' | 'invalid' };

function parseFiniteNumber(raw: string): GramsParse {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, issue: 'blank' };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false, issue: 'invalid' };
  return { ok: true, value };
}

export function parseStartingWeightGrams(raw: string): GramsParse {
  const parsed = parseFiniteNumber(raw);
  if (!parsed.ok) return parsed;
  if (parsed.value <= 0) return { ok: false, issue: 'invalid' };
  return parsed;
}

export function parseEstimatedWasteGrams(
  raw: string,
  startingWeightGrams: number,
): GramsParse {
  const parsed = parseFiniteNumber(raw);
  if (!parsed.ok) return parsed;
  if (parsed.value < 0 || parsed.value > startingWeightGrams) {
    return { ok: false, issue: 'invalid' };
  }
  return parsed;
}

export function parseActualWasteGrams(
  raw: string,
  startingWeightGrams: number,
): GramsParse {
  return parseEstimatedWasteGrams(raw, startingWeightGrams);
}

export function validateIngredientSetup(fields: {
  ingredientCategory: string;
  ingredientName: string;
  startingWeightGrams: string;
}): string[] {
  const issues: string[] = [];
  if (!isKitchenDayIngredientCategory(fields.ingredientCategory)) {
    issues.push('ingredientCategory');
  }
  if (!fields.ingredientName.trim() || !normalizeIngredientId(fields.ingredientName)) {
    issues.push('ingredientName');
  }
  if (!parseStartingWeightGrams(fields.startingWeightGrams).ok) {
    issues.push('startingWeightGrams');
  }
  return issues;
}

export function canContinueToEstimate(technique: string | null): boolean {
  return technique !== null && isTrimTechnique(technique);
}
