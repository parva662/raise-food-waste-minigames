import type { KitchenDayRescueEntry } from '../kitchenDay/types';
import type { ActivityMessage } from './types';
import {
  mapRescueAndReuse,
  orderedRescueAndReusePropertyRefs,
  type RescueAndReusePropertyRef,
} from './mapRescueAndReuse';

export function buildRescueAndReuseActivityMessage(
  entry: KitchenDayRescueEntry,
): ActivityMessage {
  const values = mapRescueAndReuse(entry);
  const start = new Date(entry.submittedAt);
  return {
    type: 'ACTIVITY',
    data: {
      template: 'rescueAndReuse',
      start: start.toISOString(),
      end: start.toISOString(),
      properties: orderedRescueAndReusePropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as RescueAndReusePropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
