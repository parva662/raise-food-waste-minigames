import { selectWastePracticeReviewTemplate } from '../kitchenDay/kitchenDayTask';
import type { KitchenDayReviewEntry } from '../kitchenDay/types';
import type { ActivityMessage, TaskData } from './types';
import {
  mapWastePracticeReview,
  orderedWastePracticeReviewPropertyRefs,
} from './mapWastePracticeReview';

export function buildWastePracticeReviewActivityMessage(
  task: TaskData,
  entry: KitchenDayReviewEntry,
): ActivityMessage {
  const template = selectWastePracticeReviewTemplate(task);
  const values = mapWastePracticeReview(entry);
  const submitted = new Date(entry.submittedAt);
  return {
    type: 'ACTIVITY',
    data: {
      template,
      start: submitted.toISOString(),
      end: submitted.toISOString(),
      properties: orderedWastePracticeReviewPropertyRefs(entry).map((ref) => ({
        template: ref,
        obj: values[ref] as Record<string, unknown>,
      })),
    },
  };
}
