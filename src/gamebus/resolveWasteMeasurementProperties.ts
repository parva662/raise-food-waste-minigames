import type { TaskData } from './types';
import {
  orderedWasteMeasurementRequiredPropertyRefs,
  WASTE_MEASUREMENT_REQUIRED_REFS,
} from './mapWasteMeasurement';
import { findActivityTemplate, resolveLinkedPropertyRefs } from './resolveActivityProperties';
import { gamebusDevLog } from './devLog';

export const WASTE_MEASUREMENT_REF = 'wasteMeasurement';

function warnWhenTaskLinksIncomplete(task: TaskData): void {
  const activity = findActivityTemplate(task, WASTE_MEASUREMENT_REF);
  if (!activity) return;

  const linked = resolveLinkedPropertyRefs(activity);
  if (linked.length === 0) return;

  const missingRequired = WASTE_MEASUREMENT_REQUIRED_REFS.filter((ref) => !linked.includes(ref));
  if (missingRequired.length > 0) {
    gamebusDevLog('wasteMeasurement TASK linkedProperties missing canonical refs', {
      missingRequired,
      linkedPropertyRefs: linked,
      note: 'ACTIVITY will still include all required properties from the mapper',
    });
  }
}

export function assertWasteMeasurementActivity(
  task: TaskData,
  activityReference: string,
): void {
  if (activityReference !== WASTE_MEASUREMENT_REF) {
    throw new Error(
      `Unsupported activity template "${activityReference}" (expected ${WASTE_MEASUREMENT_REF})`,
    );
  }
  const activity = findActivityTemplate(task, activityReference);
  if (!activity) {
    throw new Error(`Activity template "${WASTE_MEASUREMENT_REF}" not found on TASK`);
  }

  warnWhenTaskLinksIncomplete(task);
}

/**
 * Ordered property references for wasteMeasurement ACTIVITY.properties[].template.
 * Always emits the canonical fifteen required refs from the mapper.
 */
export function propertyRefsForWasteMeasurementActivity(task: TaskData): readonly string[] {
  assertWasteMeasurementActivity(task, WASTE_MEASUREMENT_REF);
  warnWhenTaskLinksIncomplete(task);
  return orderedWasteMeasurementRequiredPropertyRefs();
}
