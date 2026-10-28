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

function seededQuantitiesForOption(
  option: LunchOption,
): Pick<MealDraft, 'mainQuantity' | 'vegetarianQuantity' | 'soupQuantity' | 'dessertQuantity'> {
  if (option === 'classic') {
    return { ...emptyPortionQuantities(), mainQuantity: 1 };
  }
  if (option === 'vegetarian') {
    return { ...emptyPortionQuantities(), vegetarianQuantity: 1 };
  }
  if (option === 'soup') {
    return { ...emptyPortionQuantities(), soupQuantity: 1, dessertQuantity: 1 };
  }
  return emptyPortionQuantities();
}

function optionActiveQuantity(draft: MealDraft, option: LunchOption): number {
  if (option === 'classic') return draft.mainQuantity;
  if (option === 'vegetarian') return draft.vegetarianQuantity;
  if (option === 'soup') return draft.soupQuantity;
  return 0;
}

/**
 * Activate a lunch option from the selection surface.
 * Food options start at quantity 1. Re-clicking the same option with a positive
 * quantity preserves it; re-clicking after reducing to 0 restores 1.
 */
export function draftForLunchOption(
  previous: MealDraft,
  option: LunchOption,
): MealDraft {
  const mealChoice = mealChoiceFromLunchOption(option);
  if (previous.lunchOption === option && previous.mealChoice === mealChoice) {
    if (option !== 'no_lunch' && optionActiveQuantity(previous, option) === 0) {
      return {
        ...previous,
        ...seededQuantitiesForOption(option),
      };
    }
    return previous;
  }
  return {
    lunchOption: option,
    mealChoice,
    ...seededQuantitiesForOption(option),
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

function draftSwitchedToOption(option: LunchOption): MealDraft {
  return {
    lunchOption: option,
    mealChoice: mealChoiceFromLunchOption(option),
    ...emptyPortionQuantities(),
  };
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
      draft = draftSwitchedToOption('soup');
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
    draft = draftSwitchedToOption(option);
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
