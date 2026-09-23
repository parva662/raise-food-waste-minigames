import type { KitchenDayTrimEntry } from '../kitchenDay/types';
import { selectKitchenDayActivityTemplate } from '../kitchenDay/kitchenDayTask';
import type { ActivityMessage, TaskData } from './types';
import {
  mapKitchenDayTrimSmart,
  orderedKitchenDayTrimPropertyRefs,
  type KitchenDayTrimPropertyRef,
} from './mapKitchenDayTrimSmart';

export function buildKitchenDayTrimSmartActivityMessage(
  task: TaskData,
  entry: KitchenDayTrimEntry,
): ActivityMessage {
  const template = selectKitchenDayActivityTemplate(task, 'trimSmart');
  const values = mapKitchenDayTrimSmart(entry);
  return {
    type: 'ACTIVITY',
    data: {
      template,
      start: entry.preparationStartedAt,
      end: entry.preparationEndedAt,
      properties: orderedKitchenDayTrimPropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as KitchenDayTrimPropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
