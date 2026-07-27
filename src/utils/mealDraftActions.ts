import type { MealChoice, MealDraft } from '../types/mealChoice';
import { adjustPortionQuantity } from './mealChoice';

export type PortionField = 'main' | 'vegetarian' | 'soup' | 'dessert';

export function emptyPortionQuantities(): Pick<
  MealDraft,
  'mainQuantity' | 'vegetarianQuantity' | 'soupQuantity' | 'dessertQuantity'
> {
  return { mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 };
}

/** Switch active meal section and clear quantities from the previous section. */
export function draftForMealChoice(
  previous: MealDraft,
  choice: MealChoice,
): MealDraft {
  if (previous.mealChoice === choice) {
    return previous;
  }
  if (choice === 'no_lunch') {
    return { mealChoice: 'no_lunch', ...emptyPortionQuantities() };
  }
  if (choice === 'regular') {
    return { mealChoice: 'regular', ...emptyPortionQuantities() };
  }
  return { mealChoice: 'soup', ...emptyPortionQuantities() };
}

export function applyPortionAdjustment(
  draft: MealDraft,
  field: PortionField,
  delta: number,
  maxQuantity: number,
): MealDraft {
  const section: MealChoice = field === 'main' || field === 'vegetarian' ? 'regular' : 'soup';

  if (draft.mealChoice !== section) {
    if (delta <= 0) {
      return draft;
    }
    draft = draftForMealChoice(draft, section);
  }

  const key =
    field === 'main'
      ? 'mainQuantity'
      : field === 'vegetarian'
        ? 'vegetarianQuantity'
        : field === 'soup'
          ? 'soupQuantity'
          : 'dessertQuantity';

  const current = draft[key];
  return {
    ...draft,
    [key]: adjustPortionQuantity(current, delta, maxQuantity),
  };
}
