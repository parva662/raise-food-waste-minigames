import { findActivityTemplate, resolveLinkedPropertyRefs } from '@/platform/gamebus/activityTemplate';
import { selectWastePracticeReviewTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import type { SilentActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapWastePracticeReview,
  orderedWastePracticeReviewPropertyRefs,
} from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';

function linkedWastePracticeReviewRefs(task: TaskData): Set<string> {
  const activity = findActivityTemplate(task, 'wastePracticeReview');
  if (!activity) return new Set();
  return new Set(resolveLinkedPropertyRefs(activity));
}

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
  const linked = linkedWastePracticeReviewRefs(task);
  // Drop optional feedback when the live template does not link chefFeedback.
  const postEntry =
    entry.chefFeedback?.trim() && linked.size > 0 && !linked.has('chefFeedback')
      ? { ...entry, chefFeedback: undefined }
      : entry;
  const values = mapWastePracticeReview(postEntry);
  const submitted = new Date(postEntry.submittedAt);
  return {
    type: 'SILENT_ACTIVITY',
    data: {
      template,
      start: submitted.toISOString(),
      end: submitted.toISOString(),
      actors: [actorId],
      properties: orderedWastePracticeReviewPropertyRefs(postEntry).map((ref) => ({
        template: ref,
        obj: values[ref] as Record<string, unknown>,
      })),
    },
  };
}
