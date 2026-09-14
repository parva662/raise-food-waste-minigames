import type { TaskActivityTemplate, TaskData, TaskLinkedProperty } from './types';
import { readGameBusLinkedPropertySlug } from './gameBusSlug';
import {
  orderedTrimSmartPropertyRefs,
  TRIM_SMART_REQUIRED_REFS,
} from './mapTrimSmart';
import { findActivityTemplate, resolveLinkedPropertyRefs } from './resolveActivityProperties';

export const TRIM_SMART_REF = 'trimSmart';

/** Properties that must not be required on the participant trimSmart template in v1. */
export const TRIM_SMART_UNSUPPORTED_REQUIRED_REFS = [
  'sessionCategoryWasteGrams',
  'chefPerformanceScore',
] as const;

function linkedPropertyRequired(
  activity: TaskActivityTemplate,
  slug: string,
): boolean {
  const linked = activity.linkedProperties ?? [];
  const match = linked.find((item) => readGameBusLinkedPropertySlug(item) === slug);
  return match?.required === true;
}

export function assertTrimSmartActivity(
  task: TaskData,
  activityReference: string,
): TaskActivityTemplate {
  if (activityReference !== TRIM_SMART_REF) {
    throw new Error(
      `Unsupported activity template "${activityReference}" (expected ${TRIM_SMART_REF})`,
    );
  }

  const activity = findActivityTemplate(task, activityReference);
  if (!activity) {
    throw new Error(`Activity template "${TRIM_SMART_REF}" not found on TASK`);
  }

  const linked = resolveLinkedPropertyRefs(activity);
  if (linked.length > 0) {
    const missingRequired = TRIM_SMART_REQUIRED_REFS.filter((ref) => !linked.includes(ref));
    if (missingRequired.length > 0) {
      throw new Error(
        `Activity template "${TRIM_SMART_REF}" missing linked property refs: ${missingRequired.join(', ')}`,
      );
    }

    for (const unsupported of TRIM_SMART_UNSUPPORTED_REQUIRED_REFS) {
      if (linked.includes(unsupported) && linkedPropertyRequired(activity, unsupported)) {
        throw new Error(
          `GameBus trimSmart template mismatch: required property "${unsupported}" is not supported in participant v1`,
        );
      }
    }

    const unexpectedRequired = linked.filter((ref) => {
      if (TRIM_SMART_REQUIRED_REFS.includes(ref as (typeof TRIM_SMART_REQUIRED_REFS)[number])) {
        return false;
      }
      if ((TRIM_SMART_UNSUPPORTED_REQUIRED_REFS as readonly string[]).includes(ref)) {
        return false;
      }
      return linkedPropertyRequired(activity, ref);
    });

    if (unexpectedRequired.length > 0) {
      throw new Error(
        `Activity template "${TRIM_SMART_REF}" has unsupported required linked property refs: ${unexpectedRequired.join(', ')}`,
      );
    }
  }

  return activity;
}

export function propertyRefsForTrimSmartActivity(task: TaskData): readonly string[] {
  assertTrimSmartActivity(task, TRIM_SMART_REF);
  return orderedTrimSmartPropertyRefs();
}

export function listLinkedPropertyRefs(activity: TaskActivityTemplate): TaskLinkedProperty[] {
  return activity.linkedProperties ?? [];
}
