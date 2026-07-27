import type { TaskActivityTemplate, TaskData } from './types';
import { STUDENT_LUNCH_CHECKIN_REFS } from './mapStudentLunchCheckinLegacy';

export const STUDENT_LUNCH_CHECKIN_REF = 'studentLunchCheckin';

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
    const missing = STUDENT_LUNCH_CHECKIN_REFS.filter((ref) => !linked.includes(ref));
    if (missing.length > 0) {
      throw new Error(
        `Activity template "${STUDENT_LUNCH_CHECKIN_REF}" missing linked property refs: ${missing.join(', ')}`,
      );
    }
  }

  return activity;
}

/** Ordered legacy property references for ACTIVITY.properties[].template */
export function propertyRefsForStudentLunchActivity(task: TaskData): readonly string[] {
  assertStudentLunchCheckinActivity(task, STUDENT_LUNCH_CHECKIN_REF);
  return STUDENT_LUNCH_CHECKIN_REFS;
}
