import { selectWastePracticeReviewTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import type { SilentActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapWastePracticeReview,
  orderedWastePracticeReviewPropertyRefs,
} from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';

export function buildWastePracticeReviewActivityMessage(
  task: TaskData,
  entry: KitchenSkillsReviewEntry,
  studentActorId: string,
): SilentActivityMessage {
  const actorId = studentActorId.trim();
  if (!actorId) {
    throw new Error('wastePracticeReview requires actors: [selectedStudentActorId]');
  }
  const template = selectWastePracticeReviewTemplate(task);
  const values = mapWastePracticeReview(entry);
  const submitted = new Date(entry.submittedAt);
  return {
    type: 'SILENT_ACTIVITY',
    data: {
      template,
      start: submitted.toISOString(),
      end: submitted.toISOString(),
      actors: [actorId],
      properties: orderedWastePracticeReviewPropertyRefs(entry).map((ref) => ({
        template: ref,
        obj: values[ref] as Record<string, unknown>,
      })),
    },
  };
}
