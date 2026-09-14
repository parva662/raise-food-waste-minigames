import {
  TRIM_SMART_INGREDIENT_CATEGORIES,
  TRIM_SMART_PRACTICES,
  type TrimSmartIngredientCategory,
  type TrimSmartPractice,
} from './types';
import { normalizeIngredientId } from './ingredientId';

export function validateIngredientStepInput(fields: {
  ingredientCategory: string;
  ingredientName: string;
  startingWeightGrams: string;
}): string[] {
  const issues: string[] = [];

  if (
    !(TRIM_SMART_INGREDIENT_CATEGORIES as readonly string[]).includes(fields.ingredientCategory)
  ) {
    issues.push('ingredientCategory');
  }

  if (!fields.ingredientName.trim()) {
    issues.push('ingredientName');
  } else if (!normalizeIngredientId(fields.ingredientName)) {
    issues.push('ingredientName');
  }

  const weightRaw = fields.startingWeightGrams.trim();
  if (weightRaw === '') {
    issues.push('startingWeightGrams');
  } else {
    const weight = Number(weightRaw);
    if (!Number.isFinite(weight) || weight <= 0) {
      issues.push('startingWeightGrams');
    }
  }

  return issues;
}

export function parseStartingWeightGrams(
  raw: string,
): { ok: true; value: number } | { ok: false; issue: 'blank' | 'invalid' } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, issue: 'blank' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, issue: 'invalid' };
  }
  return { ok: true, value };
}

export function parseParticipantWasteGrams(
  raw: string,
): { ok: true; value: number } | { ok: false; issue: 'blank' | 'invalid' } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, issue: 'blank' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, issue: 'invalid' };
  }
  return { ok: true, value };
}

export function isTrimSmartPractice(value: string): value is TrimSmartPractice {
  return (TRIM_SMART_PRACTICES as readonly string[]).includes(value);
}

export function isIngredientCategory(value: string): value is TrimSmartIngredientCategory {
  return (TRIM_SMART_INGREDIENT_CATEGORIES as readonly string[]).includes(value);
}
