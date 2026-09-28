import { selectWastePracticeReviewTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { KitchenDayReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import type { ActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapWastePracticeReview,
  orderedWastePracticeReviewPropertyRefs,
} from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';

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
