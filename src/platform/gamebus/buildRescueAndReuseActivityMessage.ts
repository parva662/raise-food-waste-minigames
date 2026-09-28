import type { KitchenDayRescueEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { selectKitchenDayActivityTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { ActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapRescueAndReuse,
  orderedRescueAndReusePropertyRefs,
  type RescueAndReusePropertyRef,
} from '@/platform/gamebus/mapRescueAndReuse';

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
