import type { MealDraft } from '@/shared/menu/mealChoice';
import {
  findActivityTemplate,
  resolveLinkedPropertyRefs,
  resolvePropertyRefsForActivity,
} from '@/platform/gamebus/activityTemplate';
import type { TaskActivityTemplate, TaskData } from '@/platform/gamebus/types';
import {
  orderedPropertyRefsForDraft,
  STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS,
  STUDENT_LUNCH_CHECKIN_REQUIRED_REFS,
  type StudentLunchOptionalItemRef,
} from '@/products/lunch-declaration/gamebus/mapStudentLunchCheckin';

export {
  findActivityTemplate,
  resolveLinkedPropertyRefs,
  resolvePropertyRefsForActivity,
};

export const STUDENT_LUNCH_CHECKIN_REF = 'studentLunchCheckin';

const QUANTITY_BY_OPTIONAL_ITEM_REF: Record<
  StudentLunchOptionalItemRef,
  'mainQuantity' | 'vegetarianQuantity' | 'soupQuantity' | 'dessertQuantity'
> = {
  mainItemId: 'mainQuantity',
  vegetarianItemId: 'vegetarianQuantity',
  soupItemId: 'soupQuantity',
  dessertItemId: 'dessertQuantity',
};

export function assertStudentLunchCheckinActivity(
  task: TaskData,
  activityReference: string,
): TaskActivityTemplate {
  if (activityReference !== STUDENT_LUNCH_CHECKIN_REF) {
    throw new Error(
      `Unsupported activity template "${activityReference}" (expected ${STUDENT_LUNCH_CHECKIN_REF})`,
    );
  }
  const activity = findActivityTemplate(task, activityReference);
  if (!activity) {
    throw new Error(`Activity template "${STUDENT_LUNCH_CHECKIN_REF}" not found on TASK`);
  }

  const linked = resolveLinkedPropertyRefs(activity);
  if (linked.length > 0) {
    const missingRequired = STUDENT_LUNCH_CHECKIN_REQUIRED_REFS.filter((ref) => !linked.includes(ref));
    if (missingRequired.length > 0) {
      throw new Error(
        `Activity template "${STUDENT_LUNCH_CHECKIN_REF}" missing linked property refs: ${missingRequired.join(', ')}`,
      );
    }
  }

  return activity;
}

/** Ordered property references for ACTIVITY.properties[].template (item IDs only when selected). */
export function propertyRefsForStudentLunchActivity(
  task: TaskData,
  draft: MealDraft,
): readonly string[] {
  assertStudentLunchCheckinActivity(task, STUDENT_LUNCH_CHECKIN_REF);
  const linked = resolveLinkedPropertyRefs(
    findActivityTemplate(task, STUDENT_LUNCH_CHECKIN_REF)!,
  );
  const ordered = orderedPropertyRefsForDraft(draft);

  if (linked.length === 0) {
    return ordered;
  }

  for (const itemRef of STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS) {
    const qty = draft[QUANTITY_BY_OPTIONAL_ITEM_REF[itemRef]];
    if (qty > 0 && !linked.includes(itemRef)) {
      throw new Error(
        `Activity template "${STUDENT_LUNCH_CHECKIN_REF}" missing linked property ref "${itemRef}" for selected dish`,
      );
    }
  }

  return ordered;
}
