import type { MenuCategory } from '../types/menu';

export type CloseoutCategoryKey = 'main' | 'vegetarian' | 'soup' | 'dessert';

export const CLOSEOUT_CATEGORY_KEYS: readonly CloseoutCategoryKey[] = [
  'main',
  'vegetarian',
  'soup',
  'dessert',
] as const;

export const CLOSEOUT_CATEGORY_TO_MENU: Record<CloseoutCategoryKey, MenuCategory> = {
  main: 'classic',
  vegetarian: 'vegetarian',
  soup: 'soup',
  dessert: 'dessert',
};

export const CLOSEOUT_CATEGORY_LABELS: Record<CloseoutCategoryKey, string> = {
  main: 'Main',
  vegetarian: 'Vegetarian',
  soup: 'Soup',
  dessert: 'Dessert',
};

export type CloseoutCategoryActuals = {
  itemId: string;
  preparedQuantity: number;
  portionWeightGrams: number;
  overproductionGrams: number;
};

export type ServiceCloseout = {
  /** Service date (ISO date). */
  targetDate: string;
  actualCustomers: number;
  main: CloseoutCategoryActuals;
  vegetarian: CloseoutCategoryActuals;
  soup: CloseoutCategoryActuals;
  dessert: CloseoutCategoryActuals;
  submittedAt: string;
};

/** Session-local UI form record — overproduction remains in grams. */
export type ServiceCloseoutFormRecord = ServiceCloseout;

export type CloseoutCategoryDraft = {
  preparedQuantity: number | null;
  overproductionGrams: number | null;
};

export type ServiceCloseoutDraft = {
  actualCustomers: number | null;
  main: CloseoutCategoryDraft;
  vegetarian: CloseoutCategoryDraft;
  soup: CloseoutCategoryDraft;
  dessert: CloseoutCategoryDraft;
};

export type CloseoutFormStatus = 'draft' | 'ready' | 'finalized';

export const CLOSEOUT_NOT_ENTERED_LABEL = 'Not entered';

export const CLOSEOUT_INCOMPLETE_MESSAGE =
  'Enter actual customers and all prepared and overproduction values to continue.';

export function createEmptyCloseoutDraft(): ServiceCloseoutDraft {
  const emptyCategory = (): CloseoutCategoryDraft => ({
    preparedQuantity: null,
    overproductionGrams: null,
  });
  return {
    actualCustomers: null,
    main: emptyCategory(),
    vegetarian: emptyCategory(),
    soup: emptyCategory(),
    dessert: emptyCategory(),
  };
}

export function isCloseoutDraftComplete(draft: ServiceCloseoutDraft): boolean {
  return (
    draft.actualCustomers !== null &&
    CLOSEOUT_CATEGORY_KEYS.every(
      (key) =>
        draft[key].preparedQuantity !== null && draft[key].overproductionGrams !== null,
    )
  );
}
