import type { KitchenDayTrimEntry } from '../kitchenDay/types';
import type { ActivityMessage } from './types';
import {
  mapKitchenDayTrimSmart,
  orderedKitchenDayTrimPropertyRefs,
  type KitchenDayTrimPropertyRef,
} from './mapKitchenDayTrimSmart';

export function buildKitchenDayTrimSmartActivityMessage(
  entry: KitchenDayTrimEntry,
): ActivityMessage {
  const values = mapKitchenDayTrimSmart(entry);
  return {
    type: 'ACTIVITY',
    data: {
      template: 'trimSmart',
      start: entry.preparationStartedAt,
      end: entry.preparationEndedAt,
      properties: orderedKitchenDayTrimPropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as KitchenDayTrimPropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
