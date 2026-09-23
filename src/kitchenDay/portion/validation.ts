import { PORTION_UNITS, type PortionUnit, type RecipeCompositionLine } from '../types';
import type { RecipeReference } from './recipes';

export function parseActualAmount(raw: string): { ok: true; value: number } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return { ok: false };
  return { ok: true, value };
}

export function parseFinalRecipeWeightGrams(
  raw: string,
): { ok: true; value: number } | { ok: false } {
  const parsed = parseActualAmount(raw);
  if (!parsed.ok) return parsed;
  return parsed.value >= 0 ? parsed : { ok: false };
}

export function isPortionUnit(value: string): value is PortionUnit {
  return (PORTION_UNITS as readonly string[]).includes(value);
}

export function buildRecipeComposition(
  recipe: RecipeReference,
  actualsByIngredientId: Record<string, string>,
): RecipeCompositionLine[] | null {
  const lines: RecipeCompositionLine[] = [];
  for (const line of recipe.lines) {
    const parsed = parseActualAmount(actualsByIngredientId[line.ingredientId] ?? '');
    if (!parsed.ok) return null;
    lines.push({
      ingredientId: line.ingredientId,
      ingredientName: line.ingredientName,
      actualAmount: parsed.value,
      unit: line.unit,
    });
  }
  return lines;
}

export function canSubmitPortion(options: {
  recipe: RecipeReference | null;
  actualsByIngredientId: Record<string, string>;
  finalWeightRaw: string;
}): boolean {
  if (!options.recipe) return false;
  if (!buildRecipeComposition(options.recipe, options.actualsByIngredientId)) return false;
  return parseFinalRecipeWeightGrams(options.finalWeightRaw).ok;
}
