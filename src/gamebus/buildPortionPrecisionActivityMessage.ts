import type { KitchenDayPortionEntry } from '../kitchenDay/types';
import type { ActivityMessage } from './types';
import {
  mapPortionPrecision,
  orderedPortionPrecisionPropertyRefs,
  type PortionPrecisionPropertyRef,
} from './mapPortionPrecision';

export function buildPortionPrecisionActivityMessage(
  entry: KitchenDayPortionEntry,
): ActivityMessage {
  const values = mapPortionPrecision(entry);
  const start = new Date(entry.submittedAt);
  return {
    type: 'ACTIVITY',
    data: {
      template: 'portionPrecision',
      start: start.toISOString(),
      end: start.toISOString(),
      properties: orderedPortionPrecisionPropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as PortionPrecisionPropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
