import type { KitchenDayPortionEntry } from '../kitchenDay/types';
import { selectKitchenDayActivityTemplate } from '../kitchenDay/kitchenDayTask';
import type { ActivityMessage, TaskData } from './types';
import {
  mapPortionPrecision,
  orderedPortionPrecisionPropertyRefs,
  type PortionPrecisionPropertyRef,
} from './mapPortionPrecision';

export function buildPortionPrecisionActivityMessage(
  task: TaskData,
  entry: KitchenDayPortionEntry,
): ActivityMessage {
  const template = selectKitchenDayActivityTemplate(task, 'portionPrecision');
  const values = mapPortionPrecision(entry);
  const start = new Date(entry.submittedAt);
  return {
    type: 'ACTIVITY',
    data: {
      template,
      start: start.toISOString(),
      end: start.toISOString(),
      properties: orderedPortionPrecisionPropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as PortionPrecisionPropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
