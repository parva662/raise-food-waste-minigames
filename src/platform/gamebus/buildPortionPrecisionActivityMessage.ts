import type { KitchenDayPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { selectKitchenDayActivityTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { ActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapPortionPrecision,
  orderedPortionPrecisionPropertyRefs,
  type PortionPrecisionPropertyRef,
} from '@/platform/gamebus/mapPortionPrecision';

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
