import type { MenuItem } from './menu';

export type MealChoice = 'regular' | 'soup' | 'no_lunch';

/** One main, one vegetarian, one soup, one dessert per lunch day. */
export interface DailyMealSlots {
  main: MenuItem;
  vegetarian: MenuItem;
  soup: MenuItem;
  dessert: MenuItem;
}

/** Portion quantities: regular uses 0 = dish not selected; soup section uses independent soup/dessert counts. */
export interface MealDraft {
  mealChoice: MealChoice | null;
  mainQuantity: number;
  vegetarianQuantity: number;
  soupQuantity: number;
  dessertQuantity: number;
}

export function clampItemQuantity(quantity: number, maxQuantity: number): number {
  return Math.max(0, Math.min(quantity, maxQuantity));
}
