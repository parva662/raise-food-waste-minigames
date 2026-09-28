import type { MealDraft } from '@/shared/menu/mealChoice';
import { isMealDraftSubmittable } from '@/products/lunch-declaration/mealChoice';

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
