import type { KitchenDayRescueEntry } from '../kitchenDay/types';
import { selectKitchenDayActivityTemplate } from '../kitchenDay/kitchenDayTask';
import type { ActivityMessage, TaskData } from './types';
import {
  mapRescueAndReuse,
  orderedRescueAndReusePropertyRefs,
  type RescueAndReusePropertyRef,
} from './mapRescueAndReuse';

export function buildRescueAndReuseActivityMessage(
  task: TaskData,
  entry: KitchenDayRescueEntry,
): ActivityMessage {
  const template = selectKitchenDayActivityTemplate(task, 'rescueAndReuse');
  const values = mapRescueAndReuse(entry);
  const start = new Date(entry.submittedAt);
  return {
    type: 'ACTIVITY',
    data: {
      template,
      start: start.toISOString(),
      end: start.toISOString(),
      properties: orderedRescueAndReusePropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as RescueAndReusePropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
