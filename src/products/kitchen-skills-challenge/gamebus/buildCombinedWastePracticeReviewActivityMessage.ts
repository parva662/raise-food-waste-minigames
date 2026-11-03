import { findActivityTemplate, resolveLinkedPropertyRefs } from '@/platform/gamebus/activityTemplate';
import { selectWastePracticeReviewTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { SilentActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapCombinedWastePracticeReview,
  orderedCombinedWastePracticeReviewPropertyRefs,
  type KitchenSkillsCombinedReviewEntry,
  COMBINED_MODULE_PROPERTY_SLUGS,
  COMBINED_REVIEW_MODULE_ORDER,
} from '@/products/kitchen-skills-challenge/gamebus/combinedWastePracticeReview';

function linkedWastePracticeReviewRefs(task: TaskData): Set<string> {
  const activity = findActivityTemplate(task, 'wastePracticeReview');
  if (!activity) return new Set();
  return new Set(resolveLinkedPropertyRefs(activity));
}

/**
 * Drop optional module feedback when the live TASK does not link that property.
 * Never substitutes legacy chefFeedback / reviewedGame slugs.
 */
export function pruneCombinedFeedbackToLinkedProperties(
  entry: KitchenSkillsCombinedReviewEntry,
  linked: ReadonlySet<string>,
): KitchenSkillsCombinedReviewEntry {
  if (linked.size === 0) return entry;
  const modules = { ...entry.modules };
  for (const module of COMBINED_REVIEW_MODULE_ORDER) {
    const scores = modules[module];
    if (!scores?.chefFeedback?.trim()) continue;
    const feedbackSlug = COMBINED_MODULE_PROPERTY_SLUGS[module].feedback;
    if (!linked.has(feedbackSlug)) {
      modules[module] = {
        timeEfficiencyScore: scores.timeEfficiencyScore,
        preparationQualityScore: scores.preparationQualityScore,
      };
    }
  }
  return { ...entry, modules };
}

export function buildCombinedWastePracticeReviewActivityMessage(
  task: TaskData,
  entry: KitchenSkillsCombinedReviewEntry,
  studentActorId: string,
): SilentActivityMessage {
  const actorId = studentActorId.trim();
  if (!actorId) {
    throw new Error('wastePracticeReview requires actors: [selectedStudentActorId]');
  }
  const template = selectWastePracticeReviewTemplate(task);
  const linked = linkedWastePracticeReviewRefs(task);
  const postEntry = pruneCombinedFeedbackToLinkedProperties(entry, linked);
  const values = mapCombinedWastePracticeReview(postEntry);
  const submitted = new Date(postEntry.submittedAt);
  return {
    type: 'SILENT_ACTIVITY',
    data: {
      template,
      start: submitted.toISOString(),
      end: submitted.toISOString(),
      actors: [actorId],
      properties: orderedCombinedWastePracticeReviewPropertyRefs(postEntry).map((ref) => ({
        template: ref,
        obj: values[ref] as Record<string, unknown>,
      })),
    },
  };
}
