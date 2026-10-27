import type { LunchOption, MealChoice, MealDraft } from '@/shared/menu/mealChoice';
import { mealChoiceFromLunchOption } from '@/shared/menu/mealChoice';
import { adjustPortionQuantity } from '@/products/lunch-declaration/mealChoice';

export type PortionField = 'main' | 'vegetarian' | 'soup' | 'dessert' | 'soup_dessert';

export function emptyPortionQuantities(): Pick<
  MealDraft,
  'mainQuantity' | 'vegetarianQuantity' | 'soupQuantity' | 'dessertQuantity'
> {
  return { mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 };
}

export function draftForLunchOption(
  previous: MealDraft,
  option: LunchOption,
): MealDraft {
  if (previous.lunchOption === option && previous.mealChoice === mealChoiceFromLunchOption(option)) {
    return previous;
  }
  return {
    lunchOption: option,
    mealChoice: mealChoiceFromLunchOption(option),
    ...emptyPortionQuantities(),
  };
}

/** @deprecated Prefer draftForLunchOption — kept for call sites that still pass MealChoice. */
export function draftForMealChoice(
  previous: MealDraft,
  choice: MealChoice,
): MealDraft {
  if (choice === 'no_lunch') return draftForLunchOption(previous, 'no_lunch');
  if (choice === 'soup') return draftForLunchOption(previous, 'soup');
  if (previous.lunchOption === 'vegetarian') {
    return draftForLunchOption(previous, 'vegetarian');
  }
  return draftForLunchOption(previous, 'classic');
}

export function applyPortionAdjustment(
  draft: MealDraft,
  field: PortionField,
  delta: number,
  maxQuantity: number,
): MealDraft {
  if (field === 'soup_dessert' || field === 'soup' || field === 'dessert') {
    if (draft.lunchOption !== 'soup') {
      if (delta <= 0) return draft;
      draft = draftForLunchOption(draft, 'soup');
    }
    const current = draft.soupQuantity;
    const nextQty = adjustPortionQuantity(current, delta, maxQuantity);
    return {
      ...draft,
      lunchOption: 'soup',
      mealChoice: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: nextQty,
      dessertQuantity: nextQty,
    };
  }

  const option: LunchOption = field === 'main' ? 'classic' : 'vegetarian';
  if (draft.lunchOption !== option) {
    if (delta <= 0) return draft;
    draft = draftForLunchOption(draft, option);
  }

  if (field === 'main') {
    const nextQty = adjustPortionQuantity(draft.mainQuantity, delta, maxQuantity);
    return {
      ...draft,
      lunchOption: 'classic',
      mealChoice: 'regular',
      mainQuantity: nextQty,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
  }

  const nextQty = adjustPortionQuantity(draft.vegetarianQuantity, delta, maxQuantity);
  return {
    ...draft,
    lunchOption: 'vegetarian',
    mealChoice: 'regular',
    mainQuantity: 0,
    vegetarianQuantity: nextQty,
    soupQuantity: 0,
    dessertQuantity: 0,
  };
}
