import type { MealDraft } from '../types/mealChoice';
import type { TaskActivityTemplate, TaskData } from './types';
import {
  orderedPropertyRefsForDraft,
  STUDENT_LUNCH_CHECKIN_OPTIONAL_ITEM_REFS,
  STUDENT_LUNCH_CHECKIN_REQUIRED_REFS,
  type StudentLunchOptionalItemRef,
} from './mapStudentLunchCheckin';

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

export function findActivityTemplate(
  task: TaskData,
  reference: string,
): TaskActivityTemplate | undefined {
  return (task.activityTemplates ?? []).find((t) => t.reference === reference);
}

function readRefFromLinked(item: unknown): string | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const record = item as { ref?: unknown; reference?: unknown };
  const ref = record.ref;
  if (typeof ref === 'string' && ref.length > 0) return ref;
  const reference = record.reference;
  return typeof reference === 'string' && reference.length > 0 ? reference : undefined;
}

function readRefFromProperty(item: unknown): string | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const reference = (item as { reference?: unknown }).reference;
  return typeof reference === 'string' && reference.length > 0 ? reference : undefined;
}

/** Property template references linked to an activity template (runtime TASK shape). */
export function resolveLinkedPropertyRefs(activity: TaskActivityTemplate): string[] {
  const linked = activity.linkedProperties;
  if (Array.isArray(linked) && linked.length > 0) {
    return [...linked]
      .sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : 0;
        const bo = typeof b.order === 'number' ? b.order : 0;
        return ao - bo;
      })
      .map(readRefFromLinked)
      .filter((ref): ref is string => Boolean(ref));
  }

  const embedded = activity.properties;
  if (Array.isArray(embedded) && embedded.length > 0) {
    return embedded.map(readRefFromProperty).filter((ref): ref is string => Boolean(ref));
  }

  return [];
}

export function resolvePropertyRefsForActivity(
  task: TaskData,
  activityReference: string,
): string[] {
  const activity = findActivityTemplate(task, activityReference);
  if (!activity) {
    throw new Error(`Activity template "${activityReference}" not found on TASK`);
  }

  const fromActivity = resolveLinkedPropertyRefs(activity);
  if (fromActivity.length > 0) return fromActivity;

  const fromTaskLevel = (task.propertyTemplates ?? [])
    .map((p) => p.reference)
    .filter((ref) => ref.length > 0);
  if (fromTaskLevel.length > 0) return fromTaskLevel;

  return [];
}

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
