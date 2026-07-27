import type { MealDraft } from '../types/mealChoice';
import { isMealDraftSubmittable } from './mealChoice';

export function isSubmitDisabled(
  hasSavedDeclaration: boolean,
  canSubmitContent: boolean,
  menuInteractive: boolean,
): boolean {
  if (!menuInteractive) return true;
  if (hasSavedDeclaration) return true;
  return !canSubmitContent;
}

export function canSubmitMealDraft(draft: MealDraft): boolean {
  return isMealDraftSubmittable(draft);
}
