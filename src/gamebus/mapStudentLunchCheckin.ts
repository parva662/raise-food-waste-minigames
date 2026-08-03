import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';

export const STUDENT_LUNCH_CHECKIN_REQUIRED_REFS = [
  'targetDate',
  'mealType',
  'mainQuantity',
  'vegetarianQuantity',
  'soupQuantity',
  'dessertQuantity',
  'timingStatus',
  'submittedAt',
] as const;

export const STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS = [
  'mainItemId',
  'vegetarianItemId',
  'soupItemId',
  'dessertItemId',
] as const;

export type StudentLunchRequiredRef = (typeof STUDENT_LUNCH_CHECKIN_REQUIRED_REFS)[number];
export type StudentLunchOptionalItemRef = (typeof STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS)[number];
export type StudentLunchPropertyRef = StudentLunchRequiredRef | StudentLunchOptionalItemRef;

export type StudentLunchValueMap = {
  targetDate: { value: string };
  mealType: { value: ActiveDeclaration['mealChoice'] };
  mainQuantity: { value: number };
  vegetarianQuantity: { value: number };
  soupQuantity: { value: number };
  dessertQuantity: { value: number };
  timingStatus: { value: ActiveDeclaration['timingStatus'] };
  submittedAt: { value: string };
  mainItemId?: { value: string };
  vegetarianItemId?: { value: string };
  soupItemId?: { value: string };
  dessertItemId?: { value: string };
};

const ITEM_ID_BY_SLOT = {
  mainItemId: 'main',
  vegetarianItemId: 'vegetarian',
  soupItemId: 'soup',
  dessertItemId: 'dessert',
} as const satisfies Record<StudentLunchOptionalItemRef, keyof DailyMealSlots>;

const QUANTITY_BY_ITEM_REF: Record<
  StudentLunchOptionalItemRef,
  'mainQuantity' | 'vegetarianQuantity' | 'soupQuantity' | 'dessertQuantity'
> = {
  mainItemId: 'mainQuantity',
  vegetarianItemId: 'vegetarianQuantity',
  soupItemId: 'soupQuantity',
  dessertItemId: 'dessertQuantity',
};

/** Canonical ACTIVITY property order (optional item IDs omitted when quantity is 0). */
export function orderedPropertyRefsForDraft(draft: MealDraft): StudentLunchPropertyRef[] {
  const refs: StudentLunchPropertyRef[] = ['targetDate', 'mealType'];

  for (const itemRef of STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS) {
    const qtyKey = QUANTITY_BY_ITEM_REF[itemRef];
    if (draft[qtyKey] > 0) {
      refs.push(itemRef);
    }
    refs.push(
      itemRef === 'mainItemId'
        ? 'mainQuantity'
        : itemRef === 'vegetarianItemId'
          ? 'vegetarianQuantity'
          : itemRef === 'soupItemId'
            ? 'soupQuantity'
            : 'dessertQuantity',
    );
  }

  refs.push('timingStatus', 'submittedAt');
  return refs;
}

/**
 * Maps a finalized declaration to `studentLunchCheckin` property values.
 * Optional item-ID fields are present only when quantity > 0.
 */
export function mapStudentLunchCheckin(
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): StudentLunchValueMap {
  const values: StudentLunchValueMap = {
    targetDate: { value: declaration.lunchDate },
    mealType: { value: declaration.mealChoice },
    mainQuantity: { value: draft.mainQuantity },
    vegetarianQuantity: { value: draft.vegetarianQuantity },
    soupQuantity: { value: draft.soupQuantity },
    dessertQuantity: { value: draft.dessertQuantity },
    timingStatus: { value: declaration.timingStatus },
    submittedAt: { value: declaration.submittedAt },
  };

  for (const itemRef of STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS) {
    const qtyKey = QUANTITY_BY_ITEM_REF[itemRef];
    if (draft[qtyKey] > 0) {
      const slotKey = ITEM_ID_BY_SLOT[itemRef];
      values[itemRef] = { value: slots[slotKey].id };
    }
  }

  return values;
}
