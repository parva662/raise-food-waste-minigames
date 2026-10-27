import type { MenuItem } from '@/shared/menu/types';

/** GameBus `mealType` values — do not invent new enums for the ACTIVITY payload. */
export type MealChoice = 'regular' | 'soup' | 'no_lunch';

/**
 * Exclusive student lunch UI options.
 * Classic and Vegetarian both map to GameBus `mealType: regular`.
 */
export type LunchOption = 'classic' | 'vegetarian' | 'soup' | 'no_lunch';

/** One main, one vegetarian, one soup, one dessert per lunch day. */
export interface DailyMealSlots {
  main: MenuItem;
  vegetarian: MenuItem;
  soup: MenuItem;
  dessert: MenuItem;
}

/**
 * Portion draft for the exclusive four-option lunch UI.
 * Soup and dessert quantities stay identical for the Soup + Dessert package.
 */
export interface MealDraft {
  mealChoice: MealChoice | null;
  /**
   * Exclusive UI option. Optional for historical drafts; derived from mealChoice + quantities when absent.
   */
  lunchOption?: LunchOption | null;
  mainQuantity: number;
  vegetarianQuantity: number;
  soupQuantity: number;
  dessertQuantity: number;
}

export function mealChoiceFromLunchOption(option: LunchOption | null | undefined): MealChoice | null {
  if (option == null) return null;
  if (option === 'classic' || option === 'vegetarian') return 'regular';
  if (option === 'soup') return 'soup';
  return 'no_lunch';
}

/** Derive the exclusive UI option for drafts that pre-date lunchOption. */
export function resolveLunchOption(draft: MealDraft): LunchOption | null {
  if (draft.lunchOption != null) return draft.lunchOption;
  if (draft.mealChoice === null) return null;
  if (draft.mealChoice === 'no_lunch') return 'no_lunch';
  if (draft.mealChoice === 'soup') return 'soup';
  if (draft.vegetarianQuantity > 0 && draft.mainQuantity === 0) return 'vegetarian';
  if (draft.mainQuantity > 0) return 'classic';
  return 'classic';
}

export function clampItemQuantity(quantity: number, maxQuantity: number): number {
  return Math.max(0, Math.min(quantity, maxQuantity));
}
