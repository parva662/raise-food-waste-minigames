import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';

/** Legacy GameBus sentinels (schema descriptions on test env). */
export const LEGACY_NO_MAIN = 'noMain';
export const LEGACY_NO_VEG = 'noVeg';
export const LEGACY_NO_SOUP = 'noSoup';
export const LEGACY_NO_DESSERT = 'noDessert';

export const STUDENT_LUNCH_CHECKIN_REFS = [
  'targetDate',
  'comingStatus',
  'selectedMain',
  'selectedVegetarianOrNoVeg',
  'selectedSoupOrNoSoup',
  'selectedDessertOrNoDessert',
  'submittedAt',
] as const;

export type StudentLunchPropertyRef = (typeof STUDENT_LUNCH_CHECKIN_REFS)[number];

export type PropertyValueMap = Record<StudentLunchPropertyRef, { value: string }>;

function encodeItemSelection(itemId: string, quantity: number): string {
  if (quantity <= 0) return '';
  return itemId;
}

/**
 * Maps a finalized declaration to legacy `studentLunchCheckin` string properties.
 * Quantities are not separate fields on the current GameBus template.
 */
export function mapStudentLunchCheckinLegacy(
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): PropertyValueMap {
  const mealChoice = declaration.mealChoice;

  const comingStatus =
    mealChoice === 'no_lunch' ? 'not_coming' : 'coming';

  let selectedMain = LEGACY_NO_MAIN;
  let selectedVegetarianOrNoVeg = LEGACY_NO_VEG;
  let selectedSoupOrNoSoup = LEGACY_NO_SOUP;
  let selectedDessertOrNoDessert = LEGACY_NO_DESSERT;

  if (mealChoice === 'regular') {
    const main = encodeItemSelection(slots.main.id, draft.mainQuantity);
    selectedMain = main || LEGACY_NO_MAIN;
    const veg = encodeItemSelection(slots.vegetarian.id, draft.vegetarianQuantity);
    selectedVegetarianOrNoVeg = veg || LEGACY_NO_VEG;
  } else if (mealChoice === 'soup') {
    const soup = encodeItemSelection(slots.soup.id, draft.soupQuantity);
    selectedSoupOrNoSoup = soup || LEGACY_NO_SOUP;
    const dessert = encodeItemSelection(slots.dessert.id, draft.dessertQuantity);
    selectedDessertOrNoDessert = dessert || LEGACY_NO_DESSERT;
  }

  return {
    targetDate: { value: declaration.lunchDate },
    comingStatus: { value: comingStatus },
    selectedMain: { value: selectedMain },
    selectedVegetarianOrNoVeg: { value: selectedVegetarianOrNoVeg },
    selectedSoupOrNoSoup: { value: selectedSoupOrNoSoup },
    selectedDessertOrNoDessert: { value: selectedDessertOrNoDessert },
    submittedAt: { value: declaration.submittedAt },
  };
}
