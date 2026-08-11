import type { ServiceCloseout } from '../serviceCloseout/types';
import type { ActivityMessage, TaskData } from './types';
import { SERVICE_CLOSEOUT_ACTIVITY_REF } from './appMode';
import {
  mapWasteMeasurement,
  WASTE_MEASUREMENT_REQUIRED_REFS,
  type WasteMeasurementRequiredRef,
} from './mapWasteMeasurement';
import {
  assertWasteMeasurementActivity,
  propertyRefsForWasteMeasurementActivity,
} from './resolveWasteMeasurementProperties';
import { selectActivityTemplate } from './selectActivityTemplate';

export function buildWasteMeasurementActivityMessage(
  task: TaskData,
  closeout: ServiceCloseout,
): ActivityMessage {
  const { reference: templateRef } = selectActivityTemplate(task, SERVICE_CLOSEOUT_ACTIVITY_REF);
  assertWasteMeasurementActivity(task, templateRef);

  const propertyRefs = propertyRefsForWasteMeasurementActivity(task);
  const values = mapWasteMeasurement(closeout);
  const start = new Date(closeout.submittedAt);
  const end = new Date(start.getTime() + 60_000);

  const properties = propertyRefs.map((ref) => {
    const obj = values[ref as WasteMeasurementRequiredRef];
    if (obj === undefined) {
      throw new Error(`Missing wasteMeasurement value for property "${ref}"`);
    }
    return {
      template: ref,
      obj: obj as Record<string, unknown>,
    };
  });

  const templates = properties.map((property) => property.template);
  const missingRequired = WASTE_MEASUREMENT_REQUIRED_REFS.filter((ref) => !templates.includes(ref));
  if (missingRequired.length > 0) {
    throw new Error(
      `wasteMeasurement ACTIVITY missing required properties: ${missingRequired.join(', ')}`,
    );
  }

  return {
    type: 'ACTIVITY',
    data: {
      template: templateRef,
      start: start.toISOString(),
      end: end.toISOString(),
      properties,
    },
  };
}
